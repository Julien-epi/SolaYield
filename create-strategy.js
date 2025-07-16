// create-strategy.js

const anchor = require("@coral-xyz/anchor");
const fs = require("fs");
const {
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  PublicKey,
  Keypair,
} = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");

// ==== CONFIGURATION ====
const PROGRAM_ID = new PublicKey(
  "BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az"
);
const NATIVE_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

// -- Mettre le chemin correct vers ton IDL généré par Anchor --
const IDL = JSON.parse(fs.readFileSync("./target/idl/contracts.json", "utf8"));

const ADMIN_SECRET_KEY = [
  168, 6, 95, 92, 51, 106, 178, 194, 217, 225, 158, 73, 252, 207, 108, 70, 157,
  222, 21, 102, 243, 33, 164, 122, 221, 151, 89, 172, 226, 102, 121, 64, 237,
  27, 20, 1, 41, 127, 49, 200, 236, 157, 39, 222, 213, 195, 49, 228, 131, 227,
  119, 153, 33, 243, 231, 31, 206, 172, 218, 1, 152, 130, 252, 229,
];

// ==== MAIN ====
async function main() {
  // 1. Setup connexion + wallet
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  const admin = Keypair.fromSecretKey(new Uint8Array(ADMIN_SECRET_KEY));
  const wallet = new anchor.Wallet(admin);
  const provider = new anchor.AnchorProvider(connection, wallet, {});

  anchor.setProvider(provider);

  // 2. Charge le programme via l'IDL à jour
  const program = new anchor.Program(IDL, PROGRAM_ID, provider);

  // === Paramètres de la nouvelle stratégie ===
  const strategyIdNumber = 1; // Change si tu veux plusieurs stratégies
  const strategyId = new anchor.BN(strategyIdNumber);
  const strategyName = "USDC Yield Strategy";
  const apyBasisPoints = 1000; // 10.00% (1000 = 10% en basis points)

  // -- PDA calculation --
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

  // 3. Vérifie si la stratégie existe déjà
  try {
    await program.account.strategy.fetch(strategyPda);
    console.log(`❌ Strategy with id ${strategyIdNumber} already exists!`);
    return;
  } catch (e) {
    console.log("✅ Strategy ID is available.");
  }

  // 4. Création de la stratégie
  console.log("🎯 Creating strategy...");
  const tx = await program.methods
    .createStrategy(
      strategyName,
      apyBasisPoints,
      new anchor.BN(strategyIdNumber)
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

  console.log("✅ Transaction sent:", tx);
  console.log(`Voir sur Solscan: https://solscan.io/tx/${tx}?cluster=devnet`);

  // 5. Vérification post-tx
  const strat = await program.account.strategy.fetch(strategyPda);
  console.log("📋 STRATEGY DETAILS:");
  console.log(`Name: ${strat.name}`);
  console.log(`APY: ${strat.apy / 100}%`);
  console.log(`Admin: ${strat.admin.toString()}`);
  console.log(`isActive: ${strat.isActive}`);
  console.log(`Strategy ID: ${strat.strategyId.toString()}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  if (err.logs) err.logs.forEach((log) => console.error(log));
  process.exit(1);
});
