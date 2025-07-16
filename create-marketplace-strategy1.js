const { 
    Connection, 
    PublicKey, 
    Keypair, 
    Transaction, 
    TransactionInstruction, 
    SystemProgram,
    SYSVAR_RENT_PUBKEY 
} = require("@solana/web3.js");
const fs = require('fs');

async function createMarketplaceForStrategy1() {
    console.log('🏪 CRÉATION MARKETPLACE POUR STRATÉGIE 1');
    console.log('==========================================');
    
    // Configuration
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');
    const nativeSolMint = new PublicKey("So11111111111111111111111111111111111111112");
    
    // Paramètres de la marketplace
    const strategyId = 1;
    const marketplaceId = 0; // Premier marketplace pour cette stratégie
    const tradingFeeBps = 50; // 0.5% de frais de trading
    
    console.log('📋 Paramètres:');
    console.log('- Strategy ID:', strategyId);
    console.log('- Marketplace ID:', marketplaceId);
    console.log('- Trading Fee:', tradingFeeBps, 'basis points =', (tradingFeeBps / 100).toFixed(2) + '%');
    
    // Charger l'admin wallet
    let adminKeypair;
    try {
        const keypairPath = require('os').homedir() + '/.config/solana/devnet.json';
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        adminKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
        console.log('✅ Admin wallet:', adminKeypair.publicKey.toBase58());
    } catch (err) {
        console.log('❌ Impossible de charger le wallet admin');
        return;
    }
    
    try {
        // Calculer les PDAs
        const [strategyPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("strategy"), 
                Buffer.from([strategyId, 0, 0, 0, 0, 0, 0, 0]) // u64 little endian
            ],
            programId
        );
        
        const [marketplacePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("marketplace"), strategyPda.toBuffer()],
            programId
        );
        
        const [marketplaceCounterPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("marketplace_counter")],
            programId
        );
        
        const [yieldTokenMintPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("yield_token"), 
                Buffer.from([strategyId, 0, 0, 0, 0, 0, 0, 0])
            ],
            programId
        );
        
        console.log('\n🔑 PDAs calculées:');
        console.log('- Strategy PDA:', strategyPda.toBase58());
        console.log('- Marketplace PDA:', marketplacePda.toBase58());
        console.log('- Marketplace Counter PDA:', marketplaceCounterPda.toBase58());
        console.log('- Yield Token Mint PDA:', yieldTokenMintPda.toBase58());
        
        // Vérifier si la stratégie existe
        const strategyAccount = await connection.getAccountInfo(strategyPda);
        if (!strategyAccount) {
            console.log('❌ Stratégie 1 non trouvée. Assurez-vous qu\'elle a été créée.');
            return;
        }
        console.log('✅ Stratégie 1 trouvée');
        
        // Vérifier si la marketplace existe déjà
        const existingMarketplace = await connection.getAccountInfo(marketplacePda);
        if (existingMarketplace) {
            console.log('✅ Marketplace existe déjà pour cette stratégie!');
            console.log('- PDA:', marketplacePda.toBase58());
            return;
        }
        
        // Créer l'instruction create_marketplace
        const discriminator = Buffer.from([6, 47, 242, 139, 213, 113, 5, 220]); // create_marketplace
        
        // Encoder les paramètres
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
        
        console.log('\n🔧 Données d\'instruction:');
        console.log('- Discriminator:', Array.from(discriminator));
        console.log('- Strategy ID (u64):', strategyId);
        console.log('- Marketplace ID (u64):', marketplaceId);
        console.log('- Trading Fee (u16):', tradingFeeBps);
        console.log('- Taille totale:', instructionData.length, 'bytes');
        
        // Créer l'instruction
        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true }, // admin
                { pubkey: strategyPda, isSigner: false, isWritable: false }, // strategy
                { pubkey: marketplacePda, isSigner: false, isWritable: true }, // marketplace
                { pubkey: marketplaceCounterPda, isSigner: false, isWritable: true }, // marketplace_counter
                { pubkey: yieldTokenMintPda, isSigner: false, isWritable: false }, // yield_token_mint
                { pubkey: nativeSolMint, isSigner: false, isWritable: false }, // underlying_token_mint
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
                { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
            ],
            programId: programId,
            data: instructionData,
        });
        
        // Créer et envoyer la transaction
        const transaction = new Transaction().add(instruction);
        
        console.log('\n📤 Simulation de la transaction...');
        const simulation = await connection.simulateTransaction(transaction, [adminKeypair]);
        
        if (simulation.value.err) {
            console.log('❌ Simulation échouée:', simulation.value.err);
            if (simulation.value.logs) {
                console.log('📝 Logs:');
                simulation.value.logs.forEach(log => console.log('  ', log));
            }
            return;
        }
        
        console.log('✅ Simulation réussie!');
        
        console.log('\n📤 Envoi de la transaction...');
        const signature = await connection.sendTransaction(transaction, [adminKeypair], {
            commitment: 'confirmed'
        });
        
        console.log('✅ Transaction envoyée!');
        console.log('📋 Signature:', signature);
        
        // Attendre la confirmation
        console.log('\n⏳ Attente de la confirmation...');
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
            console.log('❌ Transaction échouée:', confirmation.value.err);
            return;
        }
        
        console.log('✅ Marketplace créée avec succès!');
        
        // Vérifier la création
        setTimeout(async () => {
            try {
                const marketplaceAccount = await connection.getAccountInfo(marketplacePda);
                if (marketplaceAccount) {
                    console.log('\n📊 Marketplace vérifiée:');
                    console.log('- PDA:', marketplacePda.toBase58());
                    console.log('- Taille des données:', marketplaceAccount.data.length, 'bytes');
                    console.log('- Owner:', marketplaceAccount.owner.toBase58());
                    console.log('- Lamports:', marketplaceAccount.lamports);
                    
                    // Lire quelques données de base
                    const data = marketplaceAccount.data;
                    const discriminator = data.slice(0, 8);
                    console.log('- Discriminator:', discriminator.toString('hex'));
                    
                } else {
                    console.log('❌ Marketplace non trouvée après création');
                }
            } catch (err) {
                console.log('❌ Erreur lors de la vérification:', err.message);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        if (error.logs) {
            console.log('📝 Program Logs:');
            error.logs.forEach(log => console.log('  ', log));
        }
    }
}

createMarketplaceForStrategy1().catch(console.error); 