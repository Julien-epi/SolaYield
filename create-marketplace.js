const { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY } = require("@solana/web3.js");
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

// Utilitaires PDA
function getStrategyPDA(strategyId) {
  const strategyIdBuffer = Buffer.alloc(8);
  strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), strategyIdBuffer],
    PROGRAM_ID
  );
}

function getMarketplacePDA(strategyPda) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), strategyPda.toBuffer()],
    PROGRAM_ID
  );
}

function getMarketplaceCounterPDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace_counter")],
    PROGRAM_ID
  );
}

function getYieldTokenMintPDA(strategyId) {
  const strategyIdBuffer = Buffer.alloc(8);
  strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("yield_token"), strategyIdBuffer],
    PROGRAM_ID
  );
}

class MarketplaceCreator {
  constructor() {
    this.connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // Charger le wallet admin
    const defaultWalletPath = path.join(os.homedir(), '.config', 'solana', 'devnet.json');
    const secretKey = JSON.parse(fs.readFileSync(defaultWalletPath, 'utf8'));
    this.wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
    
    console.log("✅ Using wallet:", this.wallet.publicKey.toBase58());
  }

  // Vérifier si un marketplace existe pour une stratégie
  async checkMarketplaceExists(strategyId) {
    const [strategyPda] = getStrategyPDA(strategyId);
    const [marketplacePda] = getMarketplacePDA(strategyPda);
    
    try {
      const account = await this.connection.getAccountInfo(marketplacePda);
      return { exists: !!account, pda: marketplacePda };
    } catch (error) {
      return { exists: false, pda: marketplacePda };
    }
  }

  // Créer une marketplace pour une stratégie
  async createMarketplace(strategyId, marketplaceId = 0, tradingFeeBps = 50) {
    console.log(`\n🏪 Création Marketplace pour Stratégie ${strategyId}`);
    console.log("=" .repeat(50));

    // Calculer les PDAs
    const [strategyPda] = getStrategyPDA(strategyId);
    const [marketplacePda] = getMarketplacePDA(strategyPda);
    const [marketplaceCounterPda] = getMarketplaceCounterPDA();
    const [yieldTokenMintPda] = getYieldTokenMintPDA(strategyId);

    console.log("📍 Adresses:");
    console.log("- User:", this.wallet.publicKey.toBase58());
    console.log("- Strategy:", strategyPda.toBase58());
    console.log("- Marketplace:", marketplacePda.toBase58());
    console.log("- Marketplace Counter:", marketplaceCounterPda.toBase58());
    console.log("- Yield Token Mint:", yieldTokenMintPda.toBase58());

    console.log("\n⚙️  Paramètres:");
    console.log("- Strategy ID:", strategyId);
    console.log("- Marketplace ID:", marketplaceId);
    console.log("- Trading Fee:", tradingFeeBps, "basis points =", (tradingFeeBps / 100).toFixed(2) + "%");

    try {
      // Vérifier d'abord si le marketplace existe déjà
      const { exists } = await this.checkMarketplaceExists(strategyId);
      if (exists) {
        console.log("✅ Marketplace existe déjà pour cette stratégie");
        return { success: true, exists: true, marketplacePda: marketplacePda.toBase58() };
      }

      // Vérifier que la stratégie existe
      const strategyAccount = await this.connection.getAccountInfo(strategyPda);
      if (!strategyAccount) {
        console.log("❌ Stratégie non trouvée");
        return { success: false, error: "Strategy not found" };
      }

      // Créer l'instruction create_marketplace
      const discriminator = Buffer.from([6, 47, 242, 139, 213, 113, 5, 220]); // create_marketplace

      // Arguments: strategy_id (u64) + marketplace_id (u64) + trading_fee_bps (u16)
      const strategyIdBuffer = Buffer.alloc(8);
      strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);

      const marketplaceIdBuffer = Buffer.alloc(8);
      marketplaceIdBuffer.writeBigUInt64LE(BigInt(marketplaceId), 0);

      const tradingFeeBuffer = Buffer.alloc(2);
      tradingFeeBuffer.writeUInt16LE(tradingFeeBps, 0);

      const instructionData = Buffer.concat([
        discriminator,
        strategyIdBuffer,
        marketplaceIdBuffer,
        tradingFeeBuffer
      ]);

      // Comptes requis
      const accounts = [
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },     // user
        { pubkey: strategyPda, isSigner: false, isWritable: false },             // strategy
        { pubkey: marketplacePda, isSigner: false, isWritable: true },           // marketplace
        { pubkey: marketplaceCounterPda, isSigner: false, isWritable: true },    // marketplace_counter
        { pubkey: yieldTokenMintPda, isSigner: false, isWritable: false },       // yield_token_mint
        { pubkey: NATIVE_SOL_MINT, isSigner: false, isWritable: false },         // underlying_token_mint
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },      // rent
      ];

      const instruction = new TransactionInstruction({
        keys: accounts,
        programId: PROGRAM_ID,
        data: instructionData,
      });

      // Créer et envoyer la transaction
      const transaction = new Transaction();
      transaction.add(instruction);

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;

      console.log("\n📤 Envoi de la transaction...");

      // Simuler d'abord
      const simulation = await this.connection.simulateTransaction(transaction);
      
      if (simulation.value.err) {
        console.log("❌ Simulation failed:", simulation.value.err);
        if (simulation.value.logs) {
          console.log("Logs:", simulation.value.logs.slice(-3));
        }
        return { success: false, error: simulation.value.err };
      }

      console.log("✅ Simulation successful!");
      console.log("Logs:", simulation.value.logs?.slice(-3));

      // Envoyer la transaction
      transaction.sign(this.wallet);
      const signature = await this.connection.sendRawTransaction(transaction.serialize());
      console.log("📋 Transaction signature:", signature);

      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        console.log("❌ Transaction failed:", confirmation.value.err);
        return { success: false, error: confirmation.value.err };
      }

      console.log("✅ Marketplace créé avec succès!");

      // Vérifier la création
      await this.verifyMarketplace(strategyId);

      return {
        success: true,
        signature,
        marketplacePda: marketplacePda.toBase58(),
        tradingFeeBps
      };

    } catch (error) {
      console.error("❌ Erreur:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Vérifier un marketplace créé
  async verifyMarketplace(strategyId) {
    console.log(`\n🔍 Vérification du Marketplace ${strategyId}...`);

    const [strategyPda] = getStrategyPDA(strategyId);
    const [marketplacePda] = getMarketplacePDA(strategyPda);

    try {
      const account = await this.connection.getAccountInfo(marketplacePda);

      if (account && account.data.length > 0) {
        console.log("✅ Marketplace trouvé");
        console.log("- Data Length:", account.data.length, "bytes");
        console.log("- Lamports:", account.lamports);
        console.log("- Owner:", account.owner.toBase58());

        // Essayer de décoder quelques champs basiques
        try {
          const data = account.data;
          // Les premiers 8 bytes = discriminator
          const discriminator = data.slice(0, 8).toString('hex');
          console.log("- Discriminator:", discriminator);
          
          // Strategy reference (32 bytes après discriminator)
          const strategy = new PublicKey(data.slice(8, 40));
          console.log("- Strategy:", strategy.toBase58());
          
          console.log("✅ Marketplace opérationnel!");
        } catch (decodeError) {
          console.log("📊 Marketplace data exists");
        }

        return true;
      } else {
        console.log("❌ Marketplace non trouvé");
        return false;
      }
    } catch (error) {
      console.error("❌ Erreur verification:", error.message);
      return false;
    }
  }

  // Vérifier l'état global des marketplaces
  async getMarketplaceStatus() {
    console.log("\n📊 État Global des Marketplaces");
    console.log("-" .repeat(40));

    try {
      const [marketplaceCounterPda] = getMarketplaceCounterPDA();
      
      const account = await this.connection.getAccountInfo(marketplaceCounterPda);
      
      if (account && account.data.length >= 16) {
        const count = account.data.readBigUInt64LE(8);
        console.log("✅ Marketplace Counter initialisé");
        console.log("📈 Nombre de marketplaces:", count.toString());
        return { initialized: true, count: Number(count) };
      } else {
        console.log("⚠️  Marketplace Counter non initialisé");
        return { initialized: false, count: 0 };
      }
    } catch (error) {
      console.log("❌ Erreur lecture counter:", error.message);
      return { initialized: false, count: 0 };
    }
  }
}

// Script principal
async function main() {
  try {
    console.log("🏪 SOLAYIELD MARKETPLACE CREATOR");
    console.log("=" .repeat(50));

    const creator = new MarketplaceCreator();

    // 1. Vérifier l'état des marketplaces
    const status = await creator.getMarketplaceStatus();

    // 2. Créer marketplace pour stratégie 0
    console.log("\n🎯 Création marketplace pour Stratégie 0...");
    const result = await creator.createMarketplace(
      0,    // strategy_id
      0,    // marketplace_id 
      50    // 0.5% trading fees
    );

    if (result.success) {
      console.log("\n🎉 SUCCESS!");
      console.log("✅ Marketplace créé et opérationnel");
      console.log("✅ Users peuvent maintenant trader leurs yield tokens");
      console.log("✅ Trading fees:", (50 / 100).toFixed(2) + "%");
      
      console.log("\n📋 RÉSUMÉ MARKETPLACE:");
      console.log("-" .repeat(40));
      console.log("🆔 Strategy ID: 0");
      console.log("🏪 Marketplace:", result.marketplacePda);
      console.log("💰 Trading Fees: 0.5%");
      console.log("🔗 Yield Token: CfCJKi6fC26D9J2mkiS6KXPX6Ra8pGPrA3CmGsWnfT1N");
      console.log("💱 Base Token: SOL");
    } else {
      console.log("\n❌ ÉCHEC:", result.error);
    }

  } catch (error) {
    console.error("❌ Script failed:", error.message);
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length >= 1) {
    const creator = new MarketplaceCreator();
    
    if (args[0] === "status") {
      creator.getMarketplaceStatus();
    } else if (args[0] === "create" && args.length >= 2) {
      const strategyId = parseInt(args[1]);
      const tradingFee = parseInt(args[2]) || 50;
      creator.createMarketplace(strategyId, 0, tradingFee);
    } else if (args[0] === "check" && args.length >= 2) {
      const strategyId = parseInt(args[1]);
      creator.checkMarketplaceExists(strategyId).then(result => {
        console.log(`Marketplace for strategy ${strategyId}:`, result.exists ? "EXISTS" : "NOT FOUND");
        console.log("PDA:", result.pda.toBase58());
      });
    } else {
      console.log(`
🏪 SolaYield Marketplace Creator

Usage:
  node create-marketplace.js                    Create marketplace for strategy 0
  node create-marketplace.js status             Check marketplace counter status
  node create-marketplace.js create <id> [fee] Create marketplace for strategy ID
  node create-marketplace.js check <id>         Check if marketplace exists for strategy

Examples:
  node create-marketplace.js create 1 100      Create marketplace for strategy 1 with 1% fees
  node create-marketplace.js check 0           Check marketplace for strategy 0
      `);
    }
  } else {
    main();
  }
}

module.exports = { MarketplaceCreator }; 