const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL, Keypair } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } = require("@solana/spl-token");
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

class SolaYieldCLI {
  constructor() {
    // Connection à devnet
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    
    // Gestion du wallet
    let wallet;
    try {
      wallet = anchor.Wallet.local();
    } catch (error) {
      console.log("⚠️  ANCHOR_WALLET not set, using default Solana CLI wallet...");
      
      const defaultWalletPath = path.join(os.homedir(), '.config', 'solana', 'devnet.json');
      
      if (fs.existsSync(defaultWalletPath)) {
        const secretKey = JSON.parse(fs.readFileSync(defaultWalletPath, 'utf8'));
        const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
        wallet = new anchor.Wallet(keypair);
        console.log("✅ Using Solana CLI default wallet:", keypair.publicKey.toBase58());
      } else {
        throw new Error("No wallet found! Please run: solana-keygen new --outfile ~/.config/solana/devnet.json");
      }
    }
    
    this.provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(this.provider);
    
    // Charger l'IDL déployé
    const idl = JSON.parse(fs.readFileSync('deployed-idl.json', 'utf8'));
    this.program = new anchor.Program(idl, PROGRAM_ID, this.provider);
  }

  // Utilitaires PDA
  getStrategyPDA(strategyId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  getStrategyCounterPDA() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_counter")],
      this.program.programId
    );
  }

  getUserPositionPDA(user, strategy) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("user_position"), user.toBuffer(), strategy.toBuffer()],
      this.program.programId
    );
  }

  getYieldTokenMintPDA(strategyId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("yield_token"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  getStrategyVaultPDA(strategyId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_vault"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  // 1. Initialiser le protocole
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
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("✅ Protocol initialized!");
      console.log("Transaction:", tx);
      console.log("Strategy Counter:", strategyCounter.toBase58());
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  }

  // 2. Créer une stratégie
  async createStrategy(name, apyBasisPoints, strategyId) {
    console.log(`🏗️ Creating strategy: "${name}" with ${apyBasisPoints/100}% APY...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [strategyCounter] = this.getStrategyCounterPDA();
    const [yieldTokenMint] = this.getYieldTokenMintPDA(strategyId);
    
    console.log("Debug PDAs:");
    console.log("- Strategy:", strategy.toBase58());
    console.log("- Strategy Counter:", strategyCounter.toBase58());
    console.log("- Yield Token Mint:", yieldTokenMint.toBase58());
    
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
      console.error("❌ Error:", error.message);
      console.error("Full error:", error);
    }
  }

  // 3. Obtenir le nombre de stratégies
  async getStrategyCount() {
    console.log("📊 Getting strategy count...");
    
    const [strategyCounter] = this.getStrategyCounterPDA();

    try {
      const counterAccount = await this.program.account.strategyCounter.fetch(strategyCounter);
      console.log("Total strategies:", counterAccount.count.toString());
      return counterAccount.count.toNumber();
    } catch (error) {
      console.error("❌ Error fetching strategy count:", error.message);
      return 0;
    }
  }

  // 4. Obtenir les infos d'une stratégie
  async getStrategyInfo(strategyId) {
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
      console.error("❌ Error fetching strategy:", error.message);
    }
  }
}

// CLI Usage
async function main() {
  const cli = new SolaYieldCLI();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🌾 SolaYield CLI - JavaScript Version
📋 Contract: BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az (Devnet)

Usage: node scripts/interact.js <command> [args]

Commands:
  init                                      Initialize the protocol
  create-strategy <name> <apy_bps> <id>    Create a new strategy  
  strategy-info <strategy_id>              Get strategy information
  strategy-count                           Get total number of strategies

Examples:
  node scripts/interact.js init
  node scripts/interact.js create-strategy "SOL Staking" 1000 0
  node scripts/interact.js strategy-info 0
  node scripts/interact.js strategy-count
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
      
      case "strategy-info":
        if (args.length < 2) {
          console.error("Usage: strategy-info <strategy_id>");
          return;
        }
        await cli.getStrategyInfo(parseInt(args[1]));
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

module.exports = { SolaYieldCLI }; 