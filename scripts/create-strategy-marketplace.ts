import * as anchor from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import * as fs from 'fs';

// Configuration pour le contrat déployé
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

class StrategyMarketplaceCreator {
  program: anchor.Program<any>;
  provider: anchor.AnchorProvider;
  
  constructor() {
    // Connection à devnet
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    
    // Gestion du wallet
    let wallet;
    try {
      wallet = anchor.Wallet.local();
    } catch (error) {
      console.log("⚠️  ANCHOR_WALLET not set, using default Solana CLI wallet...");
      const path = require('path');
      const os = require('os');
      
      const defaultWalletPath = path.join(os.homedir(), '.config', 'solana', 'devnet.json');
      
      if (fs.existsSync(defaultWalletPath)) {
        const secretKey = JSON.parse(fs.readFileSync(defaultWalletPath, 'utf8'));
        const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
        wallet = new anchor.Wallet(keypair);
        console.log("✅ Using wallet:", keypair.publicKey.toBase58());
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

  // Utilitaires PDA (copiés du script deployed-interact.ts)
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

  getYieldTokenMintPDA(strategyId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("yield_token"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  getMarketplacePDA(strategyAddress: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), strategyAddress.toBuffer()],
      this.program.programId
    );
  }

  getMarketplaceCounterPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace_counter")],
      this.program.programId
    );
  }

  // 1. Créer une stratégie
  async createStrategy(name: string, apyBasisPoints: number, strategyId: number) {
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
      console.error("❌ Error:", error);
      throw error;
    }
  }

  // 2. Créer une marketplace pour la stratégie
  async createMarketplace(strategyId: number, marketplaceId: number, tradingFeeBps: number) {
    console.log(`🏪 Creating marketplace for strategy ${strategyId}...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [marketplace] = this.getMarketplacePDA(strategy);
    const [marketplaceCounter] = this.getMarketplaceCounterPDA();
    const [yieldTokenMint] = this.getYieldTokenMintPDA(strategyId);
    
    console.log("Debug PDAs:");
    console.log("- Strategy:", strategy.toBase58());
    console.log("- Marketplace:", marketplace.toBase58());
    console.log("- Marketplace Counter:", marketplaceCounter.toBase58());
    console.log("- Yield Token Mint:", yieldTokenMint.toBase58());

    try {
      const tx = await this.program.methods
        .createMarketplace(
          new anchor.BN(strategyId),
          new anchor.BN(marketplaceId),
          tradingFeeBps
        )
        .accounts({
          admin: this.provider.wallet.publicKey,
          strategy,
          marketplace,
          marketplaceCounter,
          yieldTokenMint,
          underlyingTokenMint: NATIVE_SOL_MINT,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("✅ Marketplace created!");
      console.log("Transaction:", tx);
      console.log("Marketplace ID:", marketplaceId);
      console.log("Marketplace Address:", marketplace.toBase58());
    } catch (error) {
      console.error("❌ Error:", error);
      throw error;
    }
  }

  // 3. Création complète : stratégie + marketplace
  async createStrategyWithMarketplace(name: string, apy: number, tradingFee: number) {
    console.log("🚀 Creating complete strategy + marketplace setup");
    console.log("=".repeat(50));
    
    const strategyId = 0; // Utiliser un ID fixe pour commencer
    const marketplaceId = 0;
    const apyBasisPoints = Math.floor(apy * 100);
    const tradingFeeBps = Math.floor(tradingFee * 100);
    
    try {
      // 1. Créer la stratégie
      await this.createStrategy(name, apyBasisPoints, strategyId);
      
      console.log("");
      console.log("⏳ Waiting 3 seconds before creating marketplace...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 2. Créer la marketplace
      await this.createMarketplace(strategyId, marketplaceId, tradingFeeBps);
      
      console.log("");
      console.log("🎉 Complete setup successful!");
      console.log("=".repeat(50));
      console.log(`Strategy ID: ${strategyId}`);
      console.log(`Strategy Name: ${name}`);
      console.log(`APY: ${apy}%`);
      console.log(`Trading Fee: ${tradingFee}%`);
      
    } catch (error) {
      console.error("❌ Failed to create complete setup:", error);
      throw error;
    }
  }

  // 4. Obtenir les infos d'une stratégie (copié du script deployed-interact.ts)
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

  // 5. Obtenir les infos d'une marketplace
  async getMarketplaceInfo(strategyId: number) {
    console.log(`🏪 Getting marketplace info for strategy ${strategyId}...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [marketplace] = this.getMarketplacePDA(strategy);

    try {
      const marketplaceAccount = await this.program.account.marketplace.fetch(marketplace);
      
      console.log("🏪 Marketplace Info:");
      console.log("- Trading Fee:", (marketplaceAccount.tradingFeeBps / 100).toFixed(2) + "%");
      console.log("- Total Volume:", (marketplaceAccount.totalVolume.toNumber() / LAMPORTS_PER_SOL).toFixed(4), "SOL");
      console.log("- Total Trades:", marketplaceAccount.totalTrades.toString());
      console.log("- Active:", marketplaceAccount.isActive);
      console.log("- Created:", new Date(marketplaceAccount.createdAt.toNumber() * 1000));
    } catch (error) {
      console.error("❌ Error fetching marketplace:", error);
    }
  }
}

// CLI Usage
async function main() {
  const creator = new StrategyMarketplaceCreator();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🌾 SolaYield Strategy & Marketplace Creator
📋 Contract: BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az (Devnet)

Usage: ts-node scripts/create-strategy-marketplace.ts <command> [args]

Commands:
  create <name> <apy> <trading_fee>       Create strategy + marketplace
  create-strategy <name> <apy> <id>       Create strategy only
  create-marketplace <strategy_id> <fee>  Create marketplace only
  strategy-info <strategy_id>             Get strategy info
  marketplace-info <strategy_id>          Get marketplace info

Examples:
  ts-node scripts/create-strategy-marketplace.ts create "SOL Staking Plus" 12.5 2.5
  ts-node scripts/create-strategy-marketplace.ts create-strategy "USDC Lending" 8.0 0
  ts-node scripts/create-strategy-marketplace.ts create-marketplace 0 1.5
  ts-node scripts/create-strategy-marketplace.ts strategy-info 0
  ts-node scripts/create-strategy-marketplace.ts marketplace-info 0

Parameters:
  - name: Strategy name (string)
  - apy: Annual Percentage Yield (e.g., 12.5 for 12.5%)
  - trading_fee: Trading fee percentage (e.g., 2.5 for 2.5%)
    `);
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case "create":
        if (args.length < 4) {
          console.error("Usage: create <name> <apy> <trading_fee>");
          console.error("Example: create \"SOL Staking Plus\" 12.5 2.5");
          return;
        }
        await creator.createStrategyWithMarketplace(args[1], parseFloat(args[2]), parseFloat(args[3]));
        break;
      
      case "create-strategy":
        if (args.length < 4) {
          console.error("Usage: create-strategy <name> <apy> <id>");
          console.error("Example: create-strategy \"USDC Lending\" 8.0 0");
          return;
        }
        await creator.createStrategy(args[1], parseFloat(args[2]) * 100, parseInt(args[3]));
        break;
      
      case "create-marketplace":
        if (args.length < 3) {
          console.error("Usage: create-marketplace <strategy_id> <trading_fee>");
          console.error("Example: create-marketplace 0 1.5");
          return;
        }
        await creator.createMarketplace(parseInt(args[1]), parseInt(args[1]), parseFloat(args[2]) * 100);
        break;
      
      case "strategy-info":
        if (args.length < 2) {
          console.error("Usage: strategy-info <strategy_id>");
          console.error("Example: strategy-info 0");
          return;
        }
        await creator.getStrategyInfo(parseInt(args[1]));
        break;
      
      case "marketplace-info":
        if (args.length < 2) {
          console.error("Usage: marketplace-info <strategy_id>");
          console.error("Example: marketplace-info 0");
          return;
        }
        await creator.getMarketplaceInfo(parseInt(args[1]));
        break;
      
      default:
        console.error("Unknown command:", command);
        console.error("Use 'ts-node scripts/create-strategy-marketplace.ts' for help");
    }
  } catch (error) {
    console.error("Error executing command:", error);
  }
}

if (require.main === module) {
  main();
}

export { StrategyMarketplaceCreator }; 