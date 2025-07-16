const anchor = require("@coral-xyz/anchor");
const { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

async function debugProtocol() {
  console.log("🔍 DEBUG - SolaYield Protocol Analysis");
  console.log("=" .repeat(50));

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Charger le wallet
  const defaultWalletPath = path.join(os.homedir(), '.config', 'solana', 'devnet.json');
  const secretKey = JSON.parse(fs.readFileSync(defaultWalletPath, 'utf8'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  console.log("✅ Wallet:", wallet.publicKey.toBase58());

  // 1. Vérifier le programme
  console.log("\n1. Programme Info:");
  const programAccount = await connection.getAccountInfo(PROGRAM_ID);
  if (programAccount) {
    console.log("✅ Programme trouvé");
    console.log("- Owner:", programAccount.owner.toBase58());
    console.log("- Executable:", programAccount.executable);
    console.log("- Data Length:", programAccount.data.length);
  } else {
    console.log("❌ Programme non trouvé");
    return;
  }

  // 2. Calculer les PDAs
  console.log("\n2. PDAs:");
  const [strategyCounterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy_counter")],
    PROGRAM_ID
  );
  console.log("- Strategy Counter:", strategyCounterPda.toBase58());

  const [strategyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), Buffer.alloc(8, 0)], // Strategy ID 0
    PROGRAM_ID
  );
  console.log("- Strategy PDA (ID=0):", strategyPda.toBase58());

  const [yieldTokenMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("yield_token"), Buffer.alloc(8, 0)], // Strategy ID 0
    PROGRAM_ID
  );
  console.log("- Yield Token Mint:", yieldTokenMintPda.toBase58());

  // 3. Vérifier l'état du protocole
  console.log("\n3. État du Protocole:");
  try {
    const counterAccount = await connection.getAccountInfo(strategyCounterPda);
    if (counterAccount && counterAccount.data.length >= 16) {
      // Discriminator (8 bytes) + count (8 bytes)
      const count = counterAccount.data.readBigUInt64LE(8);
      console.log("✅ Protocole initialisé");
      console.log("📊 Nombre de stratégies:", count.toString());
    } else {
      console.log("❌ Protocole non initialisé");
    }
  } catch (error) {
    console.log("❌ Erreur lecture protocole:", error.message);
  }

  // 4. Vérifier la stratégie 0
  console.log("\n4. Stratégie 0:");
  try {
    const strategyAccount = await connection.getAccountInfo(strategyPda);
    if (strategyAccount && strategyAccount.data.length > 0) {
      console.log("✅ Stratégie 0 existe déjà!");
      console.log("- Data Length:", strategyAccount.data.length);
      return true; // Strategy already exists
    } else {
      console.log("⚪ Stratégie 0 n'existe pas encore");
      return false; // Strategy doesn't exist
    }
  } catch (error) {
    console.log("⚪ Stratégie 0 n'existe pas encore");
    return false;
  }
}

async function createStrategyDirect() {
  console.log("\n🏗️  CRÉATION DE STRATÉGIE - MÉTHODE DIRECTE");
  console.log("=" .repeat(50));

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Charger le wallet
  const defaultWalletPath = path.join(os.homedir(), '.config', 'solana', 'devnet.json');
  const secretKey = JSON.parse(fs.readFileSync(defaultWalletPath, 'utf8'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

  // Paramètres de la stratégie
  const strategyName = "SOL Test Staking";
  const apyBasisPoints = 1200; // 12%
  const strategyId = 0;

  // Calculer les PDAs
  const [strategyCounterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy_counter")],
    PROGRAM_ID
  );

  const strategyIdBuffer = Buffer.alloc(8);
  strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);

  const [strategyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), strategyIdBuffer],
    PROGRAM_ID
  );

  const [yieldTokenMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("yield_token"), strategyIdBuffer],
    PROGRAM_ID
  );

  console.log("📍 Adresses:");
  console.log("- Admin:", wallet.publicKey.toBase58());
  console.log("- Strategy:", strategyPda.toBase58());
  console.log("- Counter:", strategyCounterPda.toBase58());
  console.log("- Yield Token:", yieldTokenMintPda.toBase58());

  // Essayer différents formats de sérialisation
  const formats = [
    () => {
      // Format 1: Anchor standard
      console.log("\n🔧 Test Format 1: Anchor Standard");
      const discriminator = Buffer.from([152, 160, 107, 148, 245, 190, 127, 224]);
      
      // String avec longueur
      const nameBytes = Buffer.from(strategyName, 'utf8');
      const nameLengthBuffer = Buffer.alloc(4);
      nameLengthBuffer.writeUInt32LE(nameBytes.length, 0);
      const nameBuffer = Buffer.concat([nameLengthBuffer, nameBytes]);
      
      // APY (u16)
      const apyBuffer = Buffer.alloc(2);
      apyBuffer.writeUInt16LE(apyBasisPoints, 0);
      
      // Strategy ID (u64)
      const idBuffer = Buffer.alloc(8);
      idBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
      
      return Buffer.concat([discriminator, nameBuffer, apyBuffer, idBuffer]);
    },
    
    () => {
      // Format 2: String fixe 32 bytes + padding
      console.log("\n🔧 Test Format 2: String fixe 32 bytes");
      const discriminator = Buffer.from([152, 160, 107, 148, 245, 190, 127, 224]);
      
      // String fixe 32 bytes
      const nameBuffer = Buffer.alloc(32);
      Buffer.from(strategyName, 'utf8').copy(nameBuffer);
      
      // APY (u16)
      const apyBuffer = Buffer.alloc(2);
      apyBuffer.writeUInt16LE(apyBasisPoints, 0);
      
      // Strategy ID (u64)
      const idBuffer = Buffer.alloc(8);
      idBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
      
      return Buffer.concat([discriminator, nameBuffer, apyBuffer, idBuffer]);
    },

    () => {
      // Format 3: Avec padding/alignment
      console.log("\n🔧 Test Format 3: Avec alignment");
      const discriminator = Buffer.from([152, 160, 107, 148, 245, 190, 127, 224]);
      
      // String avec longueur + padding to 8-byte boundary
      const nameBytes = Buffer.from(strategyName, 'utf8');
      const nameLengthBuffer = Buffer.alloc(4);
      nameLengthBuffer.writeUInt32LE(nameBytes.length, 0);
      const nameWithLength = Buffer.concat([nameLengthBuffer, nameBytes]);
      
      // Pad to 8-byte boundary
      const paddingNeeded = (8 - ((nameWithLength.length) % 8)) % 8;
      const padding = Buffer.alloc(paddingNeeded);
      const nameBuffer = Buffer.concat([nameWithLength, padding]);
      
      // APY (u16) + padding to u64
      const apyBuffer = Buffer.alloc(8);
      apyBuffer.writeUInt16LE(apyBasisPoints, 0);
      
      // Strategy ID (u64)
      const idBuffer = Buffer.alloc(8);
      idBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
      
      return Buffer.concat([discriminator, nameBuffer, apyBuffer, idBuffer]);
    }
  ];

  // Comptes requis pour l'instruction
  const accounts = [
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },     // admin
    { pubkey: strategyPda, isSigner: false, isWritable: true },         // strategy
    { pubkey: strategyCounterPda, isSigner: false, isWritable: true },  // strategy_counter
    { pubkey: NATIVE_SOL_MINT, isSigner: false, isWritable: false },    // underlying_token
    { pubkey: yieldTokenMintPda, isSigner: false, isWritable: true },   // yield_token_mint
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },   // token_program
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
  ];

  // Tester chaque format
  for (let i = 0; i < formats.length; i++) {
    console.log(`\n📤 Test Format ${i + 1}:`);
    
    try {
      const instructionData = formats[i]();
      console.log("Data length:", instructionData.length, "bytes");
      console.log("Data hex:", instructionData.toString('hex'));
      
      const instruction = new TransactionInstruction({
        keys: accounts,
        programId: PROGRAM_ID,
        data: instructionData,
      });

      const transaction = new Transaction();
      transaction.add(instruction);
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;
      
      // Simuler d'abord
      const simulation = await connection.simulateTransaction(transaction);
      
      if (simulation.value.err) {
        console.log("❌ Simulation failed:", simulation.value.err);
        if (simulation.value.logs) {
          console.log("Logs:", simulation.value.logs.slice(-3));
        }
      } else {
        console.log("✅ Simulation successful!");
        console.log("Logs:", simulation.value.logs?.slice(-3));
        
        // Si la simulation réussit, envoyer la transaction
        transaction.sign(wallet);
        const signature = await connection.sendRawTransaction(transaction.serialize());
        console.log("📋 Transaction signature:", signature);
        
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        if (confirmation.value.err) {
          console.log("❌ Transaction failed:", confirmation.value.err);
        } else {
          console.log("🎉 SUCCESS! Strategy created with format", i + 1);
          return true;
        }
      }
    } catch (error) {
      console.log(`❌ Format ${i + 1} failed:`, error.message);
    }
  }

  console.log("\n❌ Tous les formats ont échoué");
  return false;
}

async function main() {
  try {
    // 1. Debug du protocole
    const strategyExists = await debugProtocol();
    
    if (strategyExists) {
      console.log("\n✅ La stratégie 0 existe déjà! Pas besoin de la créer.");
      return;
    }

    // 2. Essayer de créer la stratégie
    const success = await createStrategyDirect();
    
    if (success) {
      console.log("\n🎉 SUCCÈS! Stratégie créée avec succès!");
    } else {
      console.log("\n❌ ÉCHEC! Impossible de créer la stratégie.");
      console.log("Suggestion: Utiliser Anchor CLI ou vérifier la compatibilité IDL");
    }

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch(console.error); 