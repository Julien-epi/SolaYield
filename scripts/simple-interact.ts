import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contracts } from "../target/types/contracts";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";

// Configuration pour le contrat déployé
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");

// Native SOL mint address
const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

class SolaYieldInteract {
  program: Program<Contracts>;
  provider: anchor.AnchorProvider;
  
  constructor() {
    // Connection à devnet
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    
    // Essayer d'abord anchor.Wallet.local(), sinon créer un wallet temporaire
    let wallet;
    try {
      wallet = anchor.Wallet.local();
    } catch (error) {
      console.log("⚠️  ANCHOR_WALLET not set, using default Solana CLI wallet...");
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      
      // Essayer le wallet par défaut de Solana CLI
      const defaultWalletPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
      
      if (fs.existsSync(defaultWalletPath)) {
        const secretKey = JSON.parse(fs.readFileSync(defaultWalletPath, 'utf8'));
        const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
        wallet = new anchor.Wallet(keypair);
        console.log("✅ Using Solana CLI default wallet:", keypair.publicKey.toBase58());
      } else {
        throw new Error("No wallet found! Please run: solana-keygen new --outfile ~/.config/solana/id.json");
      }
    }
    
    this.provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(this.provider);
    
    // Charger le programme avec l'IDL
    this.program = anchor.workspace.Contracts as Program<Contracts>;
  }

  // Utilitaire pour obtenir les PDAs
  getStrategyPDA(strategyId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  getStrategyCounterPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_counter")],
      this.program.programId
    );
  }

  getUserPositionPDA(user: PublicKey, strategy: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("user_position"), user.toBuffer(), strategy.toBuffer()],
      this.program.programId
    );
  }

  getYieldTokenMintPDA(strategyId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("yield_token"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  getStrategyVaultPDA(strategyId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_vault"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  // 1. Initialiser le protocole (admin seulement)
  async initializeProtocol() {
    console.log("🚀 Initializing SolaYield Protocol...");
    
    const [strategyCounter] = this.getStrategyCounterPDA();
    
    try {
      const tx = await this.program.methods
        .initializeProtocol()
        .accounts({
          admin: this.provider.wallet.publicKey,
          strategyCounter,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      console.log("✅ Protocol initialized!");
      console.log("Transaction:", tx);
      console.log("Strategy Counter:", strategyCounter.toBase58());
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }

  // 2. Créer une stratégie (admin seulement)
  async createStrategy(name: string, apyBasisPoints: number, strategyId: number) {
    console.log(`🏗️ Creating strategy: "${name}" with ${apyBasisPoints/100}% APY...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [strategyCounter] = this.getStrategyCounterPDA();
    const [yieldTokenMint] = this.getYieldTokenMintPDA(strategyId);
    
    console.log("Debug PDAs:");
    console.log("- Strategy:", strategy.toBase58());
    console.log("- Strategy Counter:", strategyCounter.toBase58());
    console.log("- Yield Token Mint:", yieldTokenMint.toBase58());
    console.log("- Underlying Token:", NATIVE_SOL_MINT.toBase58());
    
    try {
      const tx = await this.program.methods
        .createStrategy(name, apyBasisPoints, new anchor.BN(strategyId))
        .accounts({
          admin: this.provider.wallet.publicKey,
          strategy,
          strategyCounter,
          underlyingToken: NATIVE_SOL_MINT,
          yieldTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("✅ Strategy created!");
      console.log("Transaction:", tx);
      console.log("Strategy ID:", strategyId);
      console.log("Strategy Address:", strategy.toBase58());
      console.log("Yield Token Mint:", yieldTokenMint.toBase58());
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }

  // 3. Déposer dans une stratégie
  async depositToStrategy(amount: number, strategyId: number) {
    console.log(`💰 Depositing ${amount} SOL to strategy ${strategyId}...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [userPosition] = this.getUserPositionPDA(this.provider.wallet.publicKey, strategy);
    const [yieldTokenMint] = this.getYieldTokenMintPDA(strategyId);
    const [strategyVault] = this.getStrategyVaultPDA(strategyId);
    
    // User's underlying token account (pour SOL natif, on utilise le wallet directement)
    const userUnderlyingToken = this.provider.wallet.publicKey;
    
    // User's yield token account
    const userYieldTokenAccount = await getAssociatedTokenAddress(
      yieldTokenMint,
      this.provider.wallet.publicKey
    );

    try {
      const tx = await this.program.methods
        .depositToStrategy(
          new anchor.BN(amount * LAMPORTS_PER_SOL), 
          new anchor.BN(strategyId)
        )
        .accounts({
          user: this.provider.wallet.publicKey,
          strategy,
          userPosition,
          underlyingTokenMint: NATIVE_SOL_MINT,
          userUnderlyingToken,
          strategyVault,
          yieldTokenMint,
          userYieldTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .rpc();

      console.log("✅ Deposit successful!");
      console.log("Transaction:", tx);
      console.log("Amount deposited:", amount, "SOL");
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }

  // 4. Réclamer le yield
  async claimYield(strategyId: number) {
    console.log(`🎯 Claiming yield from strategy ${strategyId}...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [userPosition] = this.getUserPositionPDA(this.provider.wallet.publicKey, strategy);
    const [yieldTokenMint] = this.getYieldTokenMintPDA(strategyId);
    
    const userYieldTokenAccount = await getAssociatedTokenAddress(
      yieldTokenMint,
      this.provider.wallet.publicKey
    );

    try {
      const tx = await this.program.methods
        .claimYield(new anchor.BN(strategyId))
        .accounts({
          user: this.provider.wallet.publicKey,
          strategy,
          userPosition,
          yieldTokenMint,
          userYieldTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .rpc();

      console.log("✅ Yield claimed!");
      console.log("Transaction:", tx);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }

  // 5. Retirer de la stratégie  
  async withdrawFromStrategy(amount: number, strategyId: number) {
    console.log(`💸 Withdrawing ${amount} SOL from strategy ${strategyId}...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [userPosition] = this.getUserPositionPDA(this.provider.wallet.publicKey, strategy);
    const [yieldTokenMint] = this.getYieldTokenMintPDA(strategyId);
    const [strategyVault] = this.getStrategyVaultPDA(strategyId);
    
    const userUnderlyingToken = this.provider.wallet.publicKey;
    const userYieldTokenAccount = await getAssociatedTokenAddress(
      yieldTokenMint,
      this.provider.wallet.publicKey
    );

    try {
      const tx = await this.program.methods
        .withdrawFromStrategy(
          new anchor.BN(amount * LAMPORTS_PER_SOL),
          new anchor.BN(strategyId)
        )
        .accounts({
          user: this.provider.wallet.publicKey,
          strategy,
          userPosition,
          underlyingTokenMint: NATIVE_SOL_MINT,
          userUnderlyingToken,
          strategyVault,
          yieldTokenMint,
          userYieldTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .rpc();

      console.log("✅ Withdrawal successful!");
      console.log("Transaction:", tx);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }

  // 6. Obtenir les infos d'une stratégie
  async getStrategyInfo(strategyId: number) {
    console.log(`📊 Getting strategy ${strategyId} info...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);

    try {
      const strategyAccount = await this.program.account.strategy.fetch(strategy);
      
      console.log("📋 Strategy Info:");
      console.log("- Name:", strategyAccount.name);
      console.log("- APY:", (strategyAccount.apy.toNumber() / 100).toFixed(2) + "%");
      console.log("- Total Deposits:", (strategyAccount.totalDeposits.toNumber() / LAMPORTS_PER_SOL).toFixed(4), "SOL");
      console.log("- Underlying Token:", strategyAccount.underlyingToken.toBase58());
      console.log("- Yield Token:", strategyAccount.yieldTokenMint.toBase58());
      console.log("- Active:", strategyAccount.isActive);
      console.log("- Created:", new Date(strategyAccount.createdAt.toNumber() * 1000));
    } catch (error) {
      console.error("❌ Error fetching strategy:", error);
    }
  }

  // 7. Obtenir la position utilisateur
  async getUserPosition(strategyId: number) {
    console.log(`👤 Getting user position in strategy ${strategyId}...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [userPosition] = this.getUserPositionPDA(this.provider.wallet.publicKey, strategy);

    try {
      const positionAccount = await this.program.account.userPosition.fetch(userPosition);
      
      console.log("📍 User Position:");
      console.log("- Deposited Amount:", (positionAccount.depositedAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(4), "SOL");
      console.log("- Yield Tokens Minted:", positionAccount.yieldTokensMinted.toString());
      console.log("- Deposit Time:", new Date(positionAccount.depositTime.toNumber() * 1000));
      console.log("- Last Yield Claim:", new Date(positionAccount.lastYieldClaim.toNumber() * 1000));
      console.log("- Total Yield Claimed:", positionAccount.totalYieldClaimed.toString());
    } catch (error) {
      console.error("❌ Error fetching user position:", error);
    }
  }

  // 8. Obtenir le nombre de stratégies
  async getStrategyCount() {
    console.log("📊 Getting strategy count...");
    
    const [strategyCounter] = this.getStrategyCounterPDA();

    try {
      const counterAccount = await this.program.account.strategyCounter.fetch(strategyCounter);
      console.log("Total strategies:", counterAccount.count.toString());
      return counterAccount.count.toNumber();
    } catch (error) {
      console.error("❌ Error fetching strategy count:", error);
      return 0;
    }
  }
}

// CLI Usage
async function main() {
  const cli = new SolaYieldInteract();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🌾 SolaYield CLI - Solana Yield Farming Protocol
📋 Contract: BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az (Devnet)

Usage: ts-node scripts/simple-interact.ts <command> [args]

Commands:
  init                                      Initialize the protocol
  create-strategy <name> <apy_bps> <id>    Create a new strategy  
  deposit <strategy_id> <amount_sol>       Deposit SOL to a strategy
  claim <strategy_id>                      Claim yield from a strategy
  withdraw <strategy_id> <amount_sol>      Withdraw SOL from a strategy
  strategy-info <strategy_id>              Get strategy information
  user-position <strategy_id>              Get user position
  strategy-count                           Get total number of strategies

Examples:
  ts-node scripts/simple-interact.ts init
  ts-node scripts/simple-interact.ts create-strategy "SOL Staking" 1000 0
  ts-node scripts/simple-interact.ts deposit 0 1.5
  ts-node scripts/simple-interact.ts claim 0
  ts-node scripts/simple-interact.ts withdraw 0 0.5
  ts-node scripts/simple-interact.ts strategy-info 0
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
          console.error("Usage: create-strategy <name> <apy_basis_points> <strategy_id>");
          console.error("Example: create-strategy \"SOL Staking\" 1000 0");
          return;
        }
        await cli.createStrategy(args[1], parseInt(args[2]), parseInt(args[3]));
        break;
      
      case "deposit":
        if (args.length < 3) {
          console.error("Usage: deposit <strategy_id> <amount_sol>");
          return;
        }
        await cli.depositToStrategy(parseFloat(args[2]), parseInt(args[1]));
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
          console.error("Usage: withdraw <strategy_id> <amount_sol>");
          return;
        }
        await cli.withdrawFromStrategy(parseFloat(args[2]), parseInt(args[1]));
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
      
      case "strategy-count":
        await cli.getStrategyCount();
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

export { SolaYieldInteract }; 