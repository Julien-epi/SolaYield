const anchor = require("@coral-xyz/anchor");
const { SystemProgram, SYSVAR_RENT_PUBKEY, PublicKey, Keypair } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

async function createStrategyWithWorkspace() {
  try {
    console.log("🚀 CREATING NEW USDC YIELD STRATEGY WITH ANCHOR WORKSPACE");
    console.log("=" .repeat(60));

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
    console.log("✅ Program loaded from workspace:", program.programId.toBase58());

    // ===== NOUVEAUX PARAMÈTRES DE LA STRATÉGIE =====
    const strategyId = 1;
    const strategyName = "USDC Yield Strategy";
    const strategyApy = 1000; // 10% APY (1000 basis points)
    
    console.log("\n📋 Strategy Parameters:");
    console.log(`- Name: ${strategyName}`);
    console.log(`- APY: ${strategyApy/100}% (${strategyApy} basis points)`);
    console.log(`- Strategy ID: ${strategyId}`);
    console.log(`- Underlying Token: SOL Native`);

    // Calculer les PDAs
    const [strategyCounterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_counter")],
      program.programId
    );

    const strategyIdBuffer = Buffer.alloc(8);
    strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);

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
    console.log(`- Strategy Counter: ${strategyCounterPda.toBase58()}`);

    // Vérifier si la stratégie existe déjà
    console.log("\n🔍 Checking if strategy already exists...");
    try {
      const existingStrategy = await program.account.strategy.fetch(strategyPda);
      console.log("❌ Strategy ID", strategyId, "already exists!");
      console.log("Existing strategy name:", existingStrategy.name);
      return;
    } catch (error) {
      console.log("✅ Strategy ID", strategyId, "is available");
    }

    // Créer la stratégie
    console.log("\n🎯 Creating strategy...");
    const tx = await program.methods
      .createStrategy(strategyName, strategyApy, new anchor.BN(strategyId))
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
    
    console.log("📋 Strategy details:");
    console.log(`- Name: ${strategyAccount.name}`);
    console.log(`- APY: ${strategyAccount.apy.toNumber() / 100}%`);
    console.log(`- Admin: ${strategyAccount.admin.toString()}`);
    console.log(`- Active: ${strategyAccount.isActive}`);
    console.log(`- Strategy ID: ${strategyAccount.strategyId.toString()}`);
    console.log(`- Total Deposits: ${strategyAccount.totalDeposits.toString()}`);
    console.log(`- Underlying Token: ${strategyAccount.underlyingToken.toString()}`);
    console.log(`- Yield Token Mint: ${strategyAccount.yieldTokenMint.toString()}`);

    // Vérifier le compteur de stratégies
    const counterAccount = await program.account.strategyCounter.fetch(strategyCounterPda);
    console.log(`- Strategy Count: ${counterAccount.count.toString()}`);

    console.log("\n🎉 SUCCESS! Strategy created and verified");
    console.log("✅ Ready for user deposits and testing");
    console.log(`✅ Integration can proceed with strategy ID ${strategyId}`);

    console.log("\n📚 STRATEGY SUMMARY:");
    console.log("-" .repeat(40));
    console.log(`🆔 Strategy ID: ${strategyId}`);
    console.log(`📋 Name: ${strategyName}`);
    console.log(`📈 APY: ${strategyApy/100}%`);
    console.log(`📍 Strategy Address: ${strategyPda.toBase58()}`);
    console.log(`🪙 Yield Token Mint: ${yieldTokenMintPda.toBase58()}`);
    console.log(`💰 Underlying Token: SOL (Native)`);

  } catch (error) {
    console.error("❌ Script failed:", error.message);
    console.error("Full error:", error);
  }
}

// Exécution
createStrategyWithWorkspace().catch(console.error); 