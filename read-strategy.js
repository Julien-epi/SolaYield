const { Connection, PublicKey } = require("@solana/web3.js");

const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");

async function readStrategy() {
  console.log("📊 LECTURE DE LA STRATÉGIE CRÉÉE");
  console.log("=" .repeat(40));

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Calculer les PDAs
  const [strategyCounterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy_counter")],
    PROGRAM_ID
  );

  const strategyIdBuffer = Buffer.alloc(8);
  strategyIdBuffer.writeBigUInt64LE(BigInt(0), 0);

  const [strategyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), strategyIdBuffer],
    PROGRAM_ID
  );

  const [yieldTokenMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("yield_token"), strategyIdBuffer],
    PROGRAM_ID
  );

  console.log("📍 Adresses:");
  console.log("- Strategy PDA:", strategyPda.toBase58());
  console.log("- Strategy Counter:", strategyCounterPda.toBase58());
  console.log("- Yield Token Mint:", yieldTokenMintPda.toBase58());

  try {
    // 1. Lire le compteur de stratégies
    console.log("\n📊 Compteur de Stratégies:");
    const counterAccount = await connection.getAccountInfo(strategyCounterPda);
    if (counterAccount && counterAccount.data.length >= 16) {
      const count = counterAccount.data.readBigUInt64LE(8);
      console.log("✅ Nombre total de stratégies:", count.toString());
    }

    // 2. Lire les données de la stratégie
    console.log("\n📋 Stratégie 0 - Données Brutes:");
    const strategyAccount = await connection.getAccountInfo(strategyPda);
    
    if (!strategyAccount || strategyAccount.data.length === 0) {
      console.log("❌ Stratégie 0 non trouvée");
      return;
    }

    console.log("✅ Données trouvées:", strategyAccount.data.length, "bytes");
    console.log("- Owner:", strategyAccount.owner.toBase58());
    console.log("- Lamports:", strategyAccount.lamports);
    
    // Décoder les données de la stratégie
    console.log("\n🔍 Décodage des Données:");
    const data = strategyAccount.data;
    
    try {
      // Anchor discriminator (8 bytes)
      const discriminator = data.slice(0, 8);
      console.log("- Discriminator:", discriminator.toString('hex'));
      
      // Admin (32 bytes)
      const admin = new PublicKey(data.slice(8, 40));
      console.log("- Admin:", admin.toBase58());
      
      // Nom (string avec longueur variable ou fixe 32 bytes)
      let offset = 40;
      let name = "";
      
      // Essayer de lire comme string avec longueur
      const nameLength = data.readUInt32LE(offset);
      if (nameLength > 0 && nameLength < 100) {
        offset += 4;
        name = data.slice(offset, offset + nameLength).toString('utf8');
        offset += nameLength;
        
        // Padding à 8-byte boundary
        const paddingNeeded = (8 - ((4 + nameLength) % 8)) % 8;
        offset += paddingNeeded;
      } else {
        // Ou lire comme string fixe 32 bytes
        name = data.slice(40, 72).toString('utf8').replace(/\0/g, '');
        offset = 72;
      }
      
      console.log("- Nom:", `"${name}"`);
      
      // APY (u16 puis padding à u64 = 8 bytes total)
      const apy = data.readUInt16LE(offset);
      console.log("- APY:", apy, "basis points =", (apy / 100).toFixed(2) + "%");
      offset += 8; // 2 bytes APY + 6 bytes padding
      
      // Strategy ID (u64)
      const strategyId = data.readBigUInt64LE(offset);
      console.log("- Strategy ID:", strategyId.toString());
      offset += 8;
      
      // Total Deposits (u64)
      const totalDeposits = data.readBigUInt64LE(offset);
      console.log("- Total Deposits:", totalDeposits.toString(), "lamports =", (Number(totalDeposits) / 1e9).toFixed(4), "SOL");
      offset += 8;
      
      // Underlying Token (32 bytes)
      const underlyingToken = new PublicKey(data.slice(offset, offset + 32));
      console.log("- Underlying Token:", underlyingToken.toBase58());
      offset += 32;
      
      // Yield Token Mint (32 bytes)
      const yieldTokenMint = new PublicKey(data.slice(offset, offset + 32));
      console.log("- Yield Token Mint:", yieldTokenMint.toBase58());
      offset += 32;
      
      // Is Active (1 byte)
      const isActive = data.readUInt8(offset);
      console.log("- Is Active:", isActive === 1 ? "✅ Oui" : "❌ Non");
      offset += 1;
      
      // Padding (7 bytes)
      offset += 7;
      
      // Created At (i64)
      const createdAt = data.readBigInt64LE(offset);
      const createdDate = new Date(Number(createdAt) * 1000);
      console.log("- Created At:", createdDate.toISOString());
      offset += 8;
      
      // Last Update (i64)
      const lastUpdate = data.readBigInt64LE(offset);
      const lastUpdateDate = new Date(Number(lastUpdate) * 1000);
      console.log("- Last Update:", lastUpdateDate.toISOString());
      
      console.log("\n🎉 STRATÉGIE DÉCODÉE AVEC SUCCÈS!");
      console.log("=" .repeat(40));
      console.log(`✅ "${name}" (ID: ${strategyId})`);
      console.log(`📈 APY: ${(apy / 100).toFixed(2)}%`);
      console.log(`💰 Total déposé: ${(Number(totalDeposits) / 1e9).toFixed(4)} SOL`);
      console.log(`🟢 Statut: ${isActive === 1 ? "Actif" : "Inactif"}`);
      console.log(`📅 Créé le: ${createdDate.toLocaleDateString()}`);

    } catch (decodeError) {
      console.log("❌ Erreur de décodage:", decodeError.message);
      console.log("📄 Données hex:", data.toString('hex'));
    }

    // 3. Vérifier le yield token mint
    console.log("\n🪙 Yield Token Mint:");
    const yieldTokenAccount = await connection.getAccountInfo(yieldTokenMintPda);
    if (yieldTokenAccount) {
      console.log("✅ Yield Token Mint créé");
      console.log("- Data Length:", yieldTokenAccount.data.length, "bytes");
      console.log("- Owner:", yieldTokenAccount.owner.toBase58());
    } else {
      console.log("❌ Yield Token Mint non trouvé");
    }

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

readStrategy().catch(console.error); 