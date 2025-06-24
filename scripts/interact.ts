import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contracts } from "../target/types/contracts";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY 
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
  createAssociatedTokenAccount,
  mintTo
} from "@solana/spl-token";

// Configuration
const NETWORK = "devnet"; // Using devnet where the contract is deployed
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");

class SolaYieldCLI {
  program: Program<Contracts>;
  provider: anchor.AnchorProvider;
  
  constructor() {
    // Set up provider
    const connection = new anchor.web3.Connection(
      NETWORK === "localnet" 
        ? "http://localhost:8899" 
        : `https://api.${NETWORK}.solana.com`,
      "confirmed"
    );
    
    const wallet = anchor.Wallet.local();
    this.provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(this.provider);
    
    // Load program
    this.program = anchor.workspace.Contracts as Program<Contracts>;
  }

  async initializeProtocol() {
    console.log("🚀 Initializing SolaYield Protocol...");
    
    const [strategyCounter] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_counter")],
      this.program.programId
    );

    try {
      const tx = await this.program.methods
        .initializeProtocol()
        .accounts({
          strategyCounter,
          admin: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Protocol initialized!");
      console.log("Transaction signature:", tx);
      console.log("Strategy Counter:", strategyCounter.toBase58());
    } catch (error) {
      console.error("❌ Error initializing protocol:", error);
    }
  }

  async createStrategy(
    name: string, 
    apy: number, 
    underlyingTokenMint: PublicKey
  ) {
    console.log(`🏗️ Creating strategy: ${name} with ${apy}% APY...`);
    
    const [strategyCounter] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_counter")],
      this.program.programId
    );

    // Get next strategy ID
    const counterAccount = await this.program.account.strategyCounter.fetch(strategyCounter);
    const strategyId = counterAccount.count;

    const [strategy] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), Buffer.from(strategyId.toString())],
      this.program.programId
    );

    // Create yield token mint
    const yieldTokenMint = Keypair.generate();
    
    try {
      const tx = await this.program.methods
        .createStrategy(name, apy)
        .accounts({
          strategy,
          strategyCounter,
          admin: this.provider.wallet.publicKey,
          underlyingTokenMint,
          yieldTokenMint: yieldTokenMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([yieldTokenMint])
        .rpc();

      console.log("✅ Strategy created!");
      console.log("Transaction signature:", tx);
      console.log("Strategy ID:", strategyId);
      console.log("Strategy Address:", strategy.toBase58());
      console.log("Yield Token Mint:", yieldTokenMint.publicKey.toBase58());
    } catch (error) {
      console.error("❌ Error creating strategy:", error);
    }
  }

  async depositToStrategy(strategyId: number, amount: number) {
    console.log(`💰 Depositing ${amount} tokens to strategy ${strategyId}...`);
    
    const [strategy] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), Buffer.from(strategyId.toString())],
      this.program.programId
    );

    const strategyAccount = await this.program.account.strategy.fetch(strategy);
    
    const [userPosition] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_position"),
        this.provider.wallet.publicKey.toBuffer(),
        Buffer.from(strategyId.toString())
      ],
      this.program.programId
    );

    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), strategy.toBuffer()],
      this.program.programId
    );

    const userTokenAccount = await getAssociatedTokenAddress(
      strategyAccount.underlyingTokenMint,
      this.provider.wallet.publicKey
    );

    const userYieldTokenAccount = await getAssociatedTokenAddress(
      strategyAccount.yieldTokenMint,
      this.provider.wallet.publicKey
    );

    try {
      const tx = await this.program.methods
        .depositToStrategy(new anchor.BN(amount * 1e9)) // Convert to lamports
        .accounts({
          strategy,
          userPosition,
          user: this.provider.wallet.publicKey,
          underlyingTokenMint: strategyAccount.underlyingTokenMint,
          yieldTokenMint: strategyAccount.yieldTokenMint,
          userTokenAccount,
          userYieldTokenAccount,
          vault,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("✅ Deposit successful!");
      console.log("Transaction signature:", tx);
      console.log("Amount deposited:", amount);
    } catch (error) {
      console.error("❌ Error depositing:", error);
    }
  }

  async claimYield(strategyId: number) {
    console.log(`🎯 Claiming yield from strategy ${strategyId}...`);
    
    const [strategy] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), Buffer.from(strategyId.toString())],
      this.program.programId
    );

    const [userPosition] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_position"),
        this.provider.wallet.publicKey.toBuffer(),
        Buffer.from(strategyId.toString())
      ],
      this.program.programId
    );

    const strategyAccount = await this.program.account.strategy.fetch(strategy);
    
    const userYieldTokenAccount = await getAssociatedTokenAddress(
      strategyAccount.yieldTokenMint,
      this.provider.wallet.publicKey
    );

    try {
      const tx = await this.program.methods
        .claimYield()
        .accounts({
          strategy,
          userPosition,
          user: this.provider.wallet.publicKey,
          yieldTokenMint: strategyAccount.yieldTokenMint,
          userYieldTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("✅ Yield claimed!");
      console.log("Transaction signature:", tx);
    } catch (error) {
      console.error("❌ Error claiming yield:", error);
    }
  }

  async withdrawFromStrategy(strategyId: number, amount: number) {
    console.log(`💸 Withdrawing ${amount} tokens from strategy ${strategyId}...`);
    
    const [strategy] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), Buffer.from(strategyId.toString())],
      this.program.programId
    );

    const [userPosition] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_position"),
        this.provider.wallet.publicKey.toBuffer(),
        Buffer.from(strategyId.toString())
      ],
      this.program.programId
    );

    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), strategy.toBuffer()],
      this.program.programId
    );

    const strategyAccount = await this.program.account.strategy.fetch(strategy);
    
    const userTokenAccount = await getAssociatedTokenAddress(
      strategyAccount.underlyingTokenMint,
      this.provider.wallet.publicKey
    );

    const userYieldTokenAccount = await getAssociatedTokenAddress(
      strategyAccount.yieldTokenMint,
      this.provider.wallet.publicKey
    );

    try {
      const tx = await this.program.methods
        .withdrawFromStrategy(new anchor.BN(amount * 1e9))
        .accounts({
          strategy,
          userPosition,
          user: this.provider.wallet.publicKey,
          underlyingTokenMint: strategyAccount.underlyingTokenMint,
          yieldTokenMint: strategyAccount.yieldTokenMint,
          userTokenAccount,
          userYieldTokenAccount,
          vault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("✅ Withdrawal successful!");
      console.log("Transaction signature:", tx);
    } catch (error) {
      console.error("❌ Error withdrawing:", error);
    }
  }

  async getStrategyInfo(strategyId: number) {
    console.log(`📊 Getting strategy ${strategyId} info...`);
    
    const [strategy] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), Buffer.from(strategyId.toString())],
      this.program.programId
    );

    try {
      const strategyAccount = await this.program.account.strategy.fetch(strategy);
      
      console.log("Strategy Info:");
      console.log("- Name:", strategyAccount.name);
      console.log("- APY:", strategyAccount.apy, "%");
      console.log("- Total Deposits:", strategyAccount.totalDeposits.toString());
      console.log("- Underlying Token:", strategyAccount.underlyingTokenMint.toBase58());
      console.log("- Yield Token:", strategyAccount.yieldTokenMint.toBase58());
    } catch (error) {
      console.error("❌ Error fetching strategy:", error);
    }
  }

  async getUserPosition(strategyId: number) {
    console.log(`👤 Getting user position in strategy ${strategyId}...`);
    
    const [userPosition] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_position"),
        this.provider.wallet.publicKey.toBuffer(),
        Buffer.from(strategyId.toString())
      ],
      this.program.programId
    );

    try {
      const positionAccount = await this.program.account.userPosition.fetch(userPosition);
      
      console.log("User Position:");
      console.log("- Deposited Amount:", positionAccount.depositedAmount.toString());
      console.log("- Yield Tokens Minted:", positionAccount.yieldTokensMinted.toString());
      console.log("- Last Claim Time:", new Date(positionAccount.lastClaimTime.toNumber() * 1000));
    } catch (error) {
      console.error("❌ Error fetching user position:", error);
    }
  }
}

// CLI Usage
async function main() {
  const cli = new SolaYieldCLI();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🌾 SolaYield CLI - Solana Yield Farming Protocol

Usage: ts-node scripts/interact.ts <command> [args]

Commands:
  init                                    Initialize the protocol
  create-strategy <name> <apy> <token>   Create a new strategy
  deposit <strategy_id> <amount>         Deposit to a strategy
  claim <strategy_id>                    Claim yield from a strategy
  withdraw <strategy_id> <amount>        Withdraw from a strategy
  strategy-info <strategy_id>            Get strategy information
  user-position <strategy_id>            Get user position

Examples:
  ts-node scripts/interact.ts init
  ts-node scripts/interact.ts create-strategy "SOL Strategy" 10 So11111111111111111111111111111111111111112
  ts-node scripts/interact.ts deposit 0 1.5
  ts-node scripts/interact.ts claim 0
    `);
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case "init":
        await cli.initializeProtocol();
        break;
      
      case "create-strategy":
        if (args.length < 4) {
          console.error("Usage: create-strategy <name> <apy> <token_mint>");
          return;
        }
        await cli.createStrategy(args[1], parseFloat(args[2]), new PublicKey(args[3]));
        break;
      
      case "deposit":
        if (args.length < 3) {
          console.error("Usage: deposit <strategy_id> <amount>");
          return;
        }
        await cli.depositToStrategy(parseInt(args[1]), parseFloat(args[2]));
        break;
      
      case "claim":
        if (args.length < 2) {
          console.error("Usage: claim <strategy_id>");
          return;
        }
        await cli.claimYield(parseInt(args[1]));
        break;
      
      case "withdraw":
        if (args.length < 3) {
          console.error("Usage: withdraw <strategy_id> <amount>");
          return;
        }
        await cli.withdrawFromStrategy(parseInt(args[1]), parseFloat(args[2]));
        break;
      
      case "strategy-info":
        if (args.length < 2) {
          console.error("Usage: strategy-info <strategy_id>");
          return;
        }
        await cli.getStrategyInfo(parseInt(args[1]));
        break;
      
      case "user-position":
        if (args.length < 2) {
          console.error("Usage: user-position <strategy_id>");
          return;
        }
        await cli.getUserPosition(parseInt(args[1]));
        break;
      
      default:
        console.error("Unknown command:", command);
    }
  } catch (error) {
    console.error("Error executing command:", error);
  }
}

if (require.main === module) {
  main();
}

export { SolaYieldCLI }; 