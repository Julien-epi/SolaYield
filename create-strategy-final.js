const anchor = require("@coral-xyz/anchor");
const {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  PublicKey,
  Keypair,
} = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require("fs");

// ==== CONFIGURATION ====
const PROGRAM_ID = new PublicKey(
  "BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az"
);
const NATIVE_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

// ==== MAIN FUNCTION ====
async function createFinalStrategy() {
  try {
    console.log("🚀 CREATING NEW USDC YIELD STRATEGY - FINAL VERSION");
    console.log("=".repeat(60));

    // 1. Connexion à Solana Devnet
    const connection = new anchor.web3.Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // 2. Utilisation de la clé admin
    const adminSecretKey = [
      168, 6, 95, 92, 51, 106, 178, 194, 217, 225, 158, 73, 252, 207, 108, 70,
      157, 222, 21, 102, 243, 33, 164, 122, 221, 151, 89, 172, 226, 102, 121,
      64, 237, 27, 20, 1, 41, 127, 49, 200, 236, 157, 39, 222, 213, 195, 49,
      228, 131, 227, 119, 153, 33, 243, 231, 31, 206, 172, 218, 1, 152, 130,
      252, 229,
    ];
    const admin = Keypair.fromSecretKey(new Uint8Array(adminSecretKey));
    const wallet = new anchor.Wallet(admin);

    const provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);

    console.log("✅ Using admin wallet:", admin.publicKey.toBase58());

    // 3. Chargement de l'IDL depuis le dossier target/idl/ généré par anchor build
    // Attention : le chemin doit être RELATIF au script lancé, ou absolu
    const idl = JSON.parse(
      fs.readFileSync("./target/idl/contracts.json", "utf8")
    );
    const program = new anchor.Program(idl, PROGRAM_ID, provider);
    console.log("✅ Program loaded from IDL:", program.programId.toBase58());

    // ==== PARAMÈTRES DE LA STRATÉGIE ====
    const strategyIdNumber = 1; // Utilisé pour les PDA
    const strategyId = new anchor.BN(strategyIdNumber); // Pour l'appel Anchor
    const strategyName = "USDC Yield Strategy";
    const apyBasisPoints = 1000; // <= number natif (u16, max 65535) ! NE PAS METTRE BN

    console.log("\n📋 Strategy Parameters:");
    console.log(`- Name: ${strategyName}`);
    console.log(
      `- APY: ${apyBasisPoints / 100}% (${apyBasisPoints} basis points)`
    );
    console.log(`- Strategy ID: ${strategyId.toString()}`);
    console.log(`- Underlying Token: SOL Native`);

    // ==== CALCUL DES PDAs ====
    // Attention : strategy_id doit être un buffer 8 bytes little-endian (comme en Rust)
    const strategyIdBuffer = Buffer.alloc(8);
    strategyIdBuffer.writeBigUInt64LE(BigInt(strategyIdNumber), 0);

    const [strategyCounterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_counter")],
      program.programId
    );
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

    // ==== VÉRIFIE SI LA STRATÉGIE EXISTE ====
    console.log("\n🔍 Checking if strategy already exists...");
    try {
      const existingStrategy = await program.account.strategy.fetch(
        strategyPda
      );
      console.log("❌ Strategy ID", strategyId.toString(), "already exists!");
      console.log("Existing strategy name:", existingStrategy.name);
      return;
    } catch (error) {
      console.log("✅ Strategy ID", strategyId.toString(), "is available");
    }

    // ==== CRÉATION DE LA STRATÉGIE ====
    console.log("\n🎯 Creating strategy...");

    const tx = await program.methods
      .createStrategy(strategyName, apyBasisPoints, strategyId)
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

    // ==== VÉRIFICATION ====
    const strategyAccount = await program.account.strategy.fetch(strategyPda);
    console.log("\n📋 Strategy Details:");
    console.log(`- Name: ${strategyAccount.name}`);
    console.log(`- APY: ${strategyAccount.apy.toNumber() / 100}%`);
    console.log(`- Admin: ${strategyAccount.admin.toString()}`);
    console.log(`- Active: ${strategyAccount.isActive}`);
    console.log(`- Strategy ID: ${strategyAccount.strategyId.toString()}`);
    console.log(
      `- Total Deposits: ${strategyAccount.totalDeposits.toString()}`
    );
    console.log(
      `- Underlying Token: ${strategyAccount.underlyingToken.toString()}`
    );
    console.log(
      `- Yield Token Mint: ${strategyAccount.yieldTokenMint.toString()}`
    );

    const counterAccount = await program.account.strategyCounter.fetch(
      strategyCounterPda
    );
    console.log(`- Total Strategies: ${counterAccount.count.toString()}`);

    console.log("\n🎉 SUCCESS! Strategy created and verified");
    console.log("✅ Ready for user deposits and testing");
    console.log(
      `✅ Integration can proceed with strategy ID ${strategyId.toString()}`
    );

    console.log("\n📚 STRATEGY SUMMARY:");
    console.log("-".repeat(50));
    console.log(`🆔 Strategy ID: ${strategyId.toString()}`);
    console.log(`📋 Name: ${strategyName}`);
    console.log(`📈 APY: ${apyBasisPoints / 100}%`);
    console.log(`📍 Strategy Address: ${strategyPda.toBase58()}`);
    console.log(`🪙 Yield Token Mint: ${yieldTokenMintPda.toBase58()}`);
    console.log(`💰 Underlying Token: SOL (Native)`);

    console.log("\n🔄 Verification transaction link:");
    console.log(`https://solscan.io/tx/${tx}?cluster=devnet`);
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    console.error("Full error:", error);
    // Affiche les logs Anchor s’ils existent
    if (error.logs) {
      console.error("Anchor logs:");
      error.logs.forEach((log) => console.error(log));
    }
  }
}

// === Exécution ===
createFinalStrategy().catch(console.error);
