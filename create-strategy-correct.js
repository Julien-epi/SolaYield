const anchor = require("@coral-xyz/anchor");
const { SystemProgram, SYSVAR_RENT_PUBKEY, PublicKey, Keypair } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");

// Configuration
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

async function createCorrectStrategy() {
  try {
    console.log("🚀 CREATING STRATEGY WITH CORRECT TYPES");
    console.log("=" .repeat(50));

    // Configuration de l'environnement
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    
    // Utiliser la clé privée admin fournie
    const adminSecretKey = [168,6,95,92,51,106,178,194,217,225,158,73,252,207,108,70,157,222,21,102,243,33,164,122,221,151,89,172,226,102,121,64,237,27,20,1,41,127,49,200,236,157,39,222,213,195,49,228,131,227,119,153,33,243,231,31,206,172,218,1,152,130,252,229];
    const admin = Keypair.fromSecretKey(new Uint8Array(adminSecretKey));
    const wallet = new anchor.Wallet(admin);
    
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);
    
    console.log("✅ Using admin wallet:", admin.publicKey.toBase58());

    // Utiliser le programme depuis workspace (après build)
    const program = anchor.workspace.Contracts;
    console.log("✅ Program loaded:", program.programId.toBase58());

    // ===== PARAMÈTRES AVEC LES TYPES CORRECTS =====
    const strategyName = "USDC Yield Strategy";      // String
    const apyBasisPoints = new anchor.BN(1000);      // u16 as BN 
    const strategyId = new anchor.BN(0);             // u64 as BN - Using ID 0 to replace corrupted strategy
    
    console.log("\n📋 Strategy Parameters:");
    console.log(`- Name: ${strategyName}`);
    console.log(`- APY: ${apyBasisPoints.toNumber()/100}% (${apyBasisPoints.toNumber()} basis points - u16 as BN)`);
    console.log(`- Strategy ID: ${strategyId.toString()} (u64 as BN) - OVERWRITING CORRUPTED STRATEGY`);

    // Calculer les PDAs
    const [strategyCounterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_counter")],
      program.programId
    );

    const strategyIdBuffer = Buffer.alloc(8);
    strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId.toString()), 0);

    const [strategyPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), strategyIdBuffer],
      program.programId
    );

    const [yieldTokenMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("yield_token"), strategyIdBuffer],
      program.programId
    );

    console.log("\n🗝️ Calculated PDAs:");
    console.log(`- Strategy PDA: ${strategyPda.toBase58()}`);
    console.log(`- Yield Token Mint: ${yieldTokenMintPda.toBase58()}`);

    // Vérifier si la stratégie existe déjà
    console.log("\n🔍 Checking if strategy already exists...");
    try {
      const existingStrategy = await program.account.strategy.fetch(strategyPda);
      console.log("⚠️ Strategy ID", strategyId.toString(), "already exists but corrupted - OVERWRITING");
      console.log("Old strategy name:", existingStrategy.name);
    } catch (error) {
      console.log("✅ Strategy ID", strategyId.toString(), "is available");
    }

    // Créer la stratégie avec les types EXACTS du contrat
    console.log("\n🎯 Creating strategy with correct types...");
    console.log("Function signature: create_strategy(name: String, apy_basis_points: u16, strategy_id: u64)");
    
    const tx = await program.methods
      .createStrategy(
        strategyName,     // String
        apyBasisPoints,   // u16 (NOT new anchor.BN()!)
        strategyId        // u64 as BN
      )
      .accounts({
        admin: admin.publicKey,
        strategy: strategyPda,
        strategyCounter: strategyCounterPda,
        underlyingToken: NATIVE_SOL_MINT,
        yieldTokenMint: yieldTokenMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([admin])
      .rpc();

    console.log("\n✅ Strategy created successfully!");
    console.log("📋 Transaction:", tx);

    // Vérifier la stratégie créée
    console.log("\n🔍 Verifying strategy...");
    const strategyAccount = await program.account.strategy.fetch(strategyPda);
    
    console.log("\n📋 Strategy Details:");
    console.log(`- Name: ${strategyAccount.name}`);
    console.log(`- APY: ${strategyAccount.apy.toNumber() / 100}%`);
    console.log(`- Admin: ${strategyAccount.admin.toString()}`);
    console.log(`- Active: ${strategyAccount.isActive}`);
    console.log(`- Strategy ID: ${strategyAccount.strategyId.toString()}`);
    console.log(`- Total Deposits: ${strategyAccount.totalDeposits.toString()}`);

    console.log("\n🎉 SUCCESS! Strategy created and verified");
    console.log(`✅ Integration can proceed with strategy ID ${strategyId.toString()}`);

    console.log("\n📚 STRATEGY SUMMARY:");
    console.log("-" .repeat(50));
    console.log(`🆔 Strategy ID: ${strategyId.toString()}`);
    console.log(`📋 Name: ${strategyName}`);
    console.log(`📈 APY: ${apyBasisPoints.toNumber()/100}%`);
    console.log(`📍 Strategy Address: ${strategyPda.toBase58()}`);
    console.log(`🪙 Yield Token Mint: ${yieldTokenMintPda.toBase58()}`);
    console.log(`💰 Underlying Token: SOL (Native)`);
    console.log(`🔄 Transaction: https://solscan.io/tx/${tx}?cluster=devnet`);

  } catch (error) {
    console.error("❌ Script failed:", error.message);
    console.error("Full error:", error);
  }
}

// Exécution
createCorrectStrategy().catch(console.error); 