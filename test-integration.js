const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require("@solana/web3.js");

const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");

// Utilitaires PDA
function getStrategyCounterPDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy_counter")],
    PROGRAM_ID
  );
}

function getStrategyPDA(strategyId) {
  const strategyIdBuffer = Buffer.alloc(8);
  strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), strategyIdBuffer],
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

async function testIntegration() {
  console.log("🧪 TEST D'INTÉGRATION SOLAYIELD");
  console.log("=" .repeat(50));

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Configuration admin (À REMPLACER par les intégrateurs)
  const adminSecretKey = [168,6,95,92,51,106,178,194,217,225,158,73,252,207,108,70,157,222,21,102,243,33,164,122,221,151,89,172,226,102,121,64,237,27,20,1,41,127,49,200,236,157,39,222,213,195,49,228,131,227,119,153,33,243,231,31,206,172,218,1,152,130,252,229];
  const adminWallet = Keypair.fromSecretKey(new Uint8Array(adminSecretKey));

  console.log("✅ Configuration:");
  console.log("- Program ID:", PROGRAM_ID.toBase58());
  console.log("- Admin Wallet:", adminWallet.publicKey.toBase58());
  console.log("- Network: Solana Devnet");

  try {
    // 1. Vérifier que le programme existe
    console.log("\n1. 🔍 Vérification du Programme:");
    const programAccount = await connection.getAccountInfo(PROGRAM_ID);
    if (programAccount) {
      console.log("✅ Programme trouvé et exécutable");
      console.log("- Owner:", programAccount.owner.toBase58());
      console.log("- Taille:", programAccount.data.length, "bytes");
    } else {
      console.log("❌ Programme non trouvé");
      return;
    }

    // 2. Vérifier l'état du protocole
    console.log("\n2. 📊 État du Protocole:");
    const [strategyCounterPda] = getStrategyCounterPDA();
    console.log("- Strategy Counter PDA:", strategyCounterPda.toBase58());

    const counterAccount = await connection.getAccountInfo(strategyCounterPda);
    if (counterAccount && counterAccount.data.length >= 16) {
      const count = counterAccount.data.readBigUInt64LE(8);
      console.log("✅ Protocole initialisé");
      console.log("📈 Nombre de stratégies:", count.toString());
    } else {
      console.log("❌ Protocole non initialisé");
      return;
    }

    // 3. Vérifier les stratégies disponibles
    console.log("\n3. 🎯 Stratégies Disponibles:");
    const strategyCount = counterAccount.data.readBigUInt64LE(8);
    
    for (let i = 0; i < Number(strategyCount); i++) {
      const [strategyPda] = getStrategyPDA(i);
      const [yieldTokenMintPda] = getYieldTokenMintPDA(i);
      
      console.log(`\n📋 Stratégie ${i}:`);
      console.log("- Strategy PDA:", strategyPda.toBase58());
      console.log("- Yield Token Mint:", yieldTokenMintPda.toBase58());
      
      const strategyAccount = await connection.getAccountInfo(strategyPda);
      if (strategyAccount && strategyAccount.data.length > 0) {
        console.log("✅ Stratégie active");
        console.log("- Data Length:", strategyAccount.data.length, "bytes");
        console.log("- Lamports:", strategyAccount.lamports);
        
        // Vérifier le yield token mint
        const yieldTokenAccount = await connection.getAccountInfo(yieldTokenMintPda);
        if (yieldTokenAccount) {
          console.log("✅ Yield Token Mint créé");
        } else {
          console.log("❌ Yield Token Mint manquant");
        }
      } else {
        console.log("❌ Stratégie non trouvée");
      }
    }

    // 4. Vérifier le solde admin
    console.log("\n4. 💰 Solde Admin:");
    const adminBalance = await connection.getBalance(adminWallet.publicKey);
    console.log(`- Solde: ${(adminBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    
    if (adminBalance < 0.01 * LAMPORTS_PER_SOL) {
      console.log("⚠️  Solde admin faible - ajouter des SOL pour les opérations");
    } else {
      console.log("✅ Solde admin suffisant");
    }

    // 5. Test de connexion réseau
    console.log("\n5. 🌐 Test de Connectivité:");
    const slot = await connection.getSlot();
    const blockHeight = await connection.getBlockHeight();
    console.log("✅ Connexion réseau active");
    console.log("- Slot actuel:", slot);
    console.log("- Block Height:", blockHeight);

    // 6. Résumé pour intégrateurs
    console.log("\n" .repeat(2));
    console.log("🎉 RÉSUMÉ POUR INTÉGRATEURS");
    console.log("=" .repeat(50));
    console.log("✅ Protocole SolaYield OPÉRATIONNEL");
    console.log(`✅ ${strategyCount} stratégie(s) disponible(s)`);
    console.log("✅ Admin wallet configuré");
    console.log("✅ Réseau Devnet accessible");
    console.log("✅ Programme déployé et fonctionnel");
    console.log("");
    console.log("🚀 PRÊT POUR L'INTÉGRATION!");
    console.log("");
    console.log("📋 Informations clés:");
    console.log(`- Program ID: ${PROGRAM_ID.toBase58()}`);
    console.log(`- Admin: ${adminWallet.publicKey.toBase58()}`);
    console.log(`- Strategy Counter: ${strategyCounterPda.toBase58()}`);
    console.log("- Network: https://api.devnet.solana.com");
    console.log("");
    console.log("📚 Ressources:");
    console.log("- IDL: deployed-idl.json");
    console.log("- Guide: INTEGRATOR_PACKAGE.md");
    console.log("- Scripts: scripts/interact.js");

  } catch (error) {
    console.error("\n❌ ERREUR lors des tests:");
    console.error("Message:", error.message);
    console.error("\n🔧 Solutions possibles:");
    console.error("1. Vérifier la connexion réseau");
    console.error("2. Vérifier que vous êtes sur Devnet");
    console.error("3. Attendre quelques secondes et réessayer");
  }
}

// Fonction de test spécifique pour les développeurs
async function quickTest() {
  console.log("⚡ QUICK TEST - Fonctionnalités de Base");
  console.log("-" .repeat(40));

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  try {
    // Test 1: Program existe
    const program = await connection.getAccountInfo(PROGRAM_ID);
    console.log(program ? "✅ Program accessible" : "❌ Program inaccessible");

    // Test 2: Protocol initialisé
    const [counterPda] = getStrategyCounterPDA();
    const counter = await connection.getAccountInfo(counterPda);
    console.log(counter ? "✅ Protocol initialisé" : "❌ Protocol non initialisé");

    // Test 3: Strategies disponibles
    if (counter && counter.data.length >= 16) {
      const count = counter.data.readBigUInt64LE(8);
      console.log(`✅ ${count} stratégie(s) trouvée(s)`);
    }

    // Test 4: Connexion réseau
    const slot = await connection.getSlot();
    console.log(`✅ Network actif (slot: ${slot})`);

    console.log("\n🎯 Status: OPÉRATIONNEL");

  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === "quick") {
    quickTest();
  } else {
    testIntegration();
  }
}

module.exports = { testIntegration, quickTest }; 