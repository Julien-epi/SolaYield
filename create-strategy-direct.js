const { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL
} = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

class DirectStrategyCreator {
  constructor() {
    this.connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // Charger le wallet
    const defaultWalletPath = path.join(os.homedir(), '.config', 'solana', 'devnet.json');
    
    if (fs.existsSync(defaultWalletPath)) {
      const secretKey = JSON.parse(fs.readFileSync(defaultWalletPath, 'utf8'));
      this.wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
      console.log("✅ Using admin wallet:", this.wallet.publicKey.toBase58());
    } else {
      throw new Error("No wallet found!");
    }
  }

  // Calculer les PDAs
  getStrategyCounterPDA() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_counter")],
      PROGRAM_ID
    );
  }

  getStrategyPDA(strategyId) {
    const strategyIdBuffer = Buffer.alloc(8);
    strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), strategyIdBuffer],
      PROGRAM_ID
    );
  }

  getYieldTokenMintPDA(strategyId) {
    const strategyIdBuffer = Buffer.alloc(8);
    strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
    return PublicKey.findProgramAddressSync(
      [Buffer.from("yield_token"), strategyIdBuffer],
      PROGRAM_ID
    );
  }

  // Créer l'instruction create_strategy manuellement
  createStrategyInstruction(name, apyBasisPoints, strategyId) {
    const [strategyPda] = this.getStrategyPDA(strategyId);
    const [strategyCounterPda] = this.getStrategyCounterPDA();
    const [yieldTokenMintPda] = this.getYieldTokenMintPDA(strategyId);

    // Construction des données de l'instruction
    // Structure Anchor : discriminator (8 bytes) + string (4 bytes length + content) + u16 + u64
    
    // Discriminator pour create_strategy (trouvé dans l'IDL déployé)
    const discriminator = Buffer.from([152, 160, 107, 148, 245, 190, 127, 224]); // Discriminator correct pour create_strategy
    
    // Nom de la stratégie (Anchor string format: 4 bytes length + content)
    const nameBytes = Buffer.from(name, 'utf8');
    const nameLengthBuffer = Buffer.alloc(4);
    nameLengthBuffer.writeUInt32LE(nameBytes.length, 0);
    const nameBuffer = Buffer.concat([nameLengthBuffer, nameBytes]);
    
    // APY en basis points (u16 little endian)
    const apyBuffer = Buffer.alloc(2);
    apyBuffer.writeUInt16LE(apyBasisPoints, 0);
    
    // Strategy ID (u64 little endian)
    const strategyIdBuffer = Buffer.alloc(8);
    strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
    
    // Concaténer toutes les données
    const instructionData = Buffer.concat([
      discriminator,
      nameBuffer,
      apyBuffer,
      strategyIdBuffer
    ]);

    // Comptes requis pour l'instruction
    const accounts = [
      { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },     // admin
      { pubkey: strategyPda, isSigner: false, isWritable: true },              // strategy
      { pubkey: strategyCounterPda, isSigner: false, isWritable: true },       // strategy_counter
      { pubkey: NATIVE_SOL_MINT, isSigner: false, isWritable: false },         // underlying_token
      { pubkey: yieldTokenMintPda, isSigner: false, isWritable: true },        // yield_token_mint
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },        // token_program
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },      // rent
    ];

    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_ID,
      data: instructionData,
    });
  }

  // Créer et envoyer la transaction
  async createStrategy(name, apyBasisPoints, strategyId) {
    console.log(`\n🏗️  Creating strategy: "${name}"`);
    console.log(`📈 APY: ${apyBasisPoints/100}%`);
    console.log(`🆔 Strategy ID: ${strategyId}`);

    const [strategyPda] = this.getStrategyPDA(strategyId);
    const [strategyCounterPda] = this.getStrategyCounterPDA();
    const [yieldTokenMintPda] = this.getYieldTokenMintPDA(strategyId);

    console.log("\n📍 Computed addresses:");
    console.log(`- Admin: ${this.wallet.publicKey.toBase58()}`);
    console.log(`- Strategy PDA: ${strategyPda.toBase58()}`);
    console.log(`- Strategy Counter: ${strategyCounterPda.toBase58()}`);
    console.log(`- Yield Token Mint: ${yieldTokenMintPda.toBase58()}`);

    try {
      // Créer l'instruction
      const instruction = this.createStrategyInstruction(name, apyBasisPoints, strategyId);
      
      // Créer la transaction
      const transaction = new Transaction();
      transaction.add(instruction);
      
      // Obtenir le latest blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Signer la transaction
      transaction.sign(this.wallet);
      
      console.log("\n📤 Sending transaction...");
      
      // Envoyer la transaction
      const signature = await this.connection.sendRawTransaction(transaction.serialize());
      
      console.log("📋 Transaction signature:", signature);
      
      // Confirmer la transaction
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        console.error("❌ Transaction failed:", confirmation.value.err);
        return { success: false, error: confirmation.value.err };
      }
      
      console.log("✅ Transaction confirmed!");
      
      // Vérifier la stratégie créée
      await this.verifyStrategy(strategyId);
      
      return {
        success: true,
        signature,
        strategyPda: strategyPda.toBase58(),
        yieldTokenMint: yieldTokenMintPda.toBase58()
      };
      
    } catch (error) {
      console.error("\n❌ Strategy creation failed:");
      console.error("Error:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Vérifier la stratégie créée
  async verifyStrategy(strategyId) {
    console.log(`\n🔍 Verifying strategy ${strategyId}...`);
    
    const [strategyPda] = this.getStrategyPDA(strategyId);
    
    try {
      const account = await this.connection.getAccountInfo(strategyPda);
      
      if (account && account.data.length > 0) {
        console.log("✅ Strategy created successfully!");
        console.log(`📊 Data Length: ${account.data.length} bytes`);
        
        // Essayer de décoder quelques champs basiques
        try {
          // Discriminator (8 bytes) + nom (32 bytes) + APY (8 bytes)...
          const name = account.data.slice(8, 40).toString('utf8').replace(/\0/g, '');
          console.log(`📋 Strategy Name: "${name}"`);
        } catch (e) {
          console.log("📊 Strategy data exists");
        }
        
        return true;
      } else {
        console.log("❌ Strategy not found");
        return false;
      }
    } catch (error) {
      console.error("❌ Error verifying strategy:", error.message);
      return false;
    }
  }

  // Vérifier l'état du protocole
  async checkProtocol() {
    console.log("\n🔍 Checking protocol status...");
    
    const [strategyCounterPda] = this.getStrategyCounterPDA();
    
    try {
      const account = await this.connection.getAccountInfo(strategyCounterPda);
      
      if (account && account.data.length >= 16) {
        const count = account.data.readBigUInt64LE(8);
        console.log("✅ Protocol initialized");
        console.log(`📊 Current strategy count: ${count.toString()}`);
        return { initialized: true, count: Number(count) };
      } else {
        console.log("❌ Protocol not initialized");
        return { initialized: false, count: 0 };
      }
    } catch (error) {
      console.log("❌ Protocol not initialized");
      return { initialized: false, count: 0 };
    }
  }
}

// Script principal
async function main() {
  try {
    console.log("🎯 SolaYield Strategy Creation Process");
    console.log("=" .repeat(50));

    const creator = new DirectStrategyCreator();

    // 1. Vérifier l'état du protocole
    const protocolStatus = await creator.checkProtocol();

    if (!protocolStatus.initialized) {
      console.log("❌ Protocol not initialized. Please run initialize_protocol first.");
      return;
    }

    // 2. Vérifier si la stratégie 1 existe déjà
    console.log("\n🔍 Checking if strategy 1 already exists...");
    const exists = await creator.verifyStrategy(1);
    
    if (exists) {
      console.log("✅ Strategy 1 already exists! No need to create.");
      return;
    }

    // 3. Créer la nouvelle stratégie avec les paramètres fournis
    console.log("\n🎯 Creating new USDC Yield Strategy...");
    const result = await creator.createStrategy(
      "USDC Yield Strategy", // nom
      1000,                  // 10% APY (en basis points)
      1                      // strategy ID
    );

    if (result.success) {
      console.log("\n🎉 SUCCESS! Strategy created and verified");
      console.log("✅ Ready for user deposits and testing");
      console.log("✅ Integration can proceed with strategy ID 1");
      
      console.log("\n📚 STRATEGY SUMMARY:");
      console.log("-" .repeat(40));
      console.log(`🆔 Strategy ID: 1`);
      console.log(`📋 Name: USDC Yield Strategy`);
      console.log(`📈 APY: 10%`);
      console.log(`📍 Strategy Address: ${result.strategyPda || 'N/A'}`);
      console.log(`🪙 Yield Token Mint: ${result.yieldTokenMint || 'N/A'}`);
      console.log(`💰 Underlying Token: SOL (Native)`);
    } else {
      console.log("\n❌ FAILED to create strategy");
      console.log("Error:", result.error);
    }

  } catch (error) {
    console.error("❌ Script failed:", error.message);
  }
}

// Exécution
main().catch(console.error); 