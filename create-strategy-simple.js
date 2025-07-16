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

// Configuration
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

class SimpleStrategyCreator {
  constructor() {
    this.connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // Utiliser la clé privée admin fournie
    const adminSecretKey = [168,6,95,92,51,106,178,194,217,225,158,73,252,207,108,70,157,222,21,102,243,33,164,122,221,151,89,172,226,102,121,64,237,27,20,1,41,127,49,200,236,157,39,222,213,195,49,228,131,227,119,153,33,243,231,31,206,172,218,1,152,130,252,229];
    this.wallet = Keypair.fromSecretKey(new Uint8Array(adminSecretKey));
    console.log("✅ Using admin wallet:", this.wallet.publicKey.toBase58());
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

  async createStrategy(name, apyBasisPoints, strategyId) {
    try {
      console.log(`\n🎯 Creating strategy: "${name}"`);
      console.log(`📈 APY: ${apyBasisPoints/100}%`);
      console.log(`🆔 Strategy ID: ${strategyId}`);

      // Calculer les PDAs
      const [strategyCounterPda] = this.getStrategyCounterPDA();
      const [strategyPda] = this.getStrategyPDA(strategyId);
      const [yieldTokenMintPda] = this.getYieldTokenMintPDA(strategyId);

      console.log("\n🗝️ Calculated addresses:");
      console.log(`- Strategy PDA: ${strategyPda.toBase58()}`);
      console.log(`- Yield Token Mint: ${yieldTokenMintPda.toBase58()}`);
      console.log(`- Strategy Counter: ${strategyCounterPda.toBase58()}`);

      // Vérifier si la stratégie existe déjà
      console.log("\n🔍 Checking if strategy already exists...");
      try {
        const account = await this.connection.getAccountInfo(strategyPda);
        if (account) {
          console.log("❌ Strategy already exists!");
          return { success: false, error: "Strategy already exists" };
        }
      } catch (error) {
        console.log("✅ Strategy ID available");
      }

      // Construire l'instruction
      const strategyIdBuffer = Buffer.alloc(8);
      strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);

      // Encoder les paramètres selon l'IDL
      const nameBuffer = Buffer.from(name, 'utf8');
      const nameLengthBuffer = Buffer.alloc(4);
      nameLengthBuffer.writeUInt32LE(nameBuffer.length, 0);

      const apyBuffer = Buffer.alloc(2);
      apyBuffer.writeUInt16LE(apyBasisPoints, 0);

      // Discriminator pour create_strategy (du deployed-idl.json)
      const discriminator = Buffer.from([152, 160, 107, 148, 245, 190, 127, 224]);

      // Construire les données d'instruction
      const instructionData = Buffer.concat([
        discriminator,
        nameLengthBuffer,
        nameBuffer,
        apyBuffer,
        strategyIdBuffer
      ]);

      // Construire l'instruction
      const createStrategyInstruction = new TransactionInstruction({
        keys: [
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true }, // admin
          { pubkey: strategyPda, isSigner: false, isWritable: true }, // strategy
          { pubkey: strategyCounterPda, isSigner: false, isWritable: true }, // strategyCounter
          { pubkey: NATIVE_SOL_MINT, isSigner: false, isWritable: false }, // underlyingToken
          { pubkey: yieldTokenMintPda, isSigner: false, isWritable: true }, // yieldTokenMint
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // tokenProgram
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
        ],
        programId: PROGRAM_ID,
        data: instructionData,
      });

      // Créer et envoyer la transaction
      const transaction = new Transaction().add(createStrategyInstruction);
      
      console.log("\n📤 Sending transaction...");
      const signature = await this.connection.sendTransaction(transaction, [this.wallet]);
      
      console.log(`📋 Transaction signature: ${signature}`);
      
      // Confirmer la transaction
      console.log("⏳ Confirming transaction...");
      await this.connection.confirmTransaction(signature, 'confirmed');

      // Vérifier la création
      console.log("\n🔍 Verifying strategy creation...");
      const strategyAccount = await this.connection.getAccountInfo(strategyPda);
      
      if (strategyAccount) {
        console.log("✅ Strategy created successfully!");
        console.log(`📊 Strategy account size: ${strategyAccount.data.length} bytes`);
        
        return { 
          success: true, 
          signature,
          strategyPda: strategyPda.toBase58(),
          yieldTokenMint: yieldTokenMintPda.toBase58()
        };
      } else {
        throw new Error("Strategy account not found after creation");
      }

    } catch (error) {
      console.error("❌ Failed to create strategy:", error.message);
      return { success: false, error: error.message };
    }
  }
}

async function main() {
  try {
    console.log("🚀 SIMPLE STRATEGY CREATION - USDC YIELD STRATEGY");
    console.log("=" .repeat(60));

    const creator = new SimpleStrategyCreator();

    // Créer la nouvelle stratégie avec les paramètres fournis
    console.log("\n🎯 Creating USDC Yield Strategy...");
    const result = await creator.createStrategy(
      "USDC Yield Strategy",  // nom
      1000,                   // 10% APY (en basis points)
      1                       // strategy ID
    );

    if (result.success) {
      console.log("\n🎉 SUCCESS! Strategy created and verified");
      console.log("✅ Ready for user deposits and testing");
      console.log(`✅ Integration can proceed with strategy ID 1`);
      
      console.log("\n📚 STRATEGY SUMMARY:");
      console.log("-" .repeat(50));
      console.log(`🆔 Strategy ID: 1`);
      console.log(`📋 Name: USDC Yield Strategy`);
      console.log(`📈 APY: 10%`);
      console.log(`📍 Strategy Address: ${result.strategyPda}`);
      console.log(`🪙 Yield Token Mint: ${result.yieldTokenMint}`);
      console.log(`💰 Underlying Token: SOL (Native)`);
      console.log(`🔄 Transaction: https://solscan.io/tx/${result.signature}?cluster=devnet`);

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