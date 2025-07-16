const { Connection, PublicKey } = require('@solana/web3.js');

async function readStrategy1Correct() {
    console.log('📊 LECTURE CORRIGÉE DE LA STRATÉGIE 1');
    console.log('========================================');
    
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');
    
    // Calculate PDA for Strategy 1
    const strategyId = 1;
    const [strategyPda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("strategy"), 
            Buffer.from([strategyId, 0, 0, 0, 0, 0, 0, 0]) // u64 little endian
        ],
        programId
    );
    
    console.log('📍 Adresse Strategy 1:', strategyPda.toBase58());
    
    try {
        const accountInfo = await connection.getAccountInfo(strategyPda);
        
        if (!accountInfo) {
            console.log('❌ Stratégie 1 non trouvée');
            return;
        }
        
        console.log('✅ Stratégie 1 trouvée!');
        console.log('- Taille des données:', accountInfo.data.length, 'bytes');
        console.log('- Owner:', accountInfo.owner.toBase58());
        console.log('- Lamports:', accountInfo.lamports);
        
        const data = accountInfo.data;
        
        // Read discriminator (8 bytes)
        const discriminator = data.slice(0, 8);
        console.log('- Discriminator:', discriminator.toString('hex'));
        
        // Read admin pubkey (32 bytes, starts at offset 8)
        const adminBytes = data.slice(8, 40);
        const admin = new PublicKey(adminBytes);
        console.log('- Admin:', admin.toBase58());
        
        // Name is at offset 104 (length) + 108 (data)
        const nameLength = data.readUInt32LE(104);
        const nameBytes = data.slice(108, 108 + nameLength);
        const name = nameBytes.toString('utf8');
        console.log('- Nom:', `"${name}"`);
        console.log('- Longueur du nom:', nameLength);
        
        // APY comes after the name
        const apyOffset = 108 + nameLength;
        const apy = data.readBigUInt64LE(apyOffset);
        console.log('- APY:', apy.toString(), 'basis points =', (Number(apy) / 100).toFixed(2) + '%');
        
        // Strategy ID comes after APY
        const strategyIdOffset = apyOffset + 8;
        const readStrategyId = data.readBigUInt64LE(strategyIdOffset);
        console.log('- Strategy ID:', readStrategyId.toString());
        
        // Total deposits comes after strategy ID
        const totalDepositsOffset = strategyIdOffset + 8;
        const totalDeposits = data.readBigUInt64LE(totalDepositsOffset);
        console.log('- Total Deposits:', totalDeposits.toString(), 'lamports =', (Number(totalDeposits) / 1e9).toFixed(4), 'SOL');
        
        // Underlying token (32 bytes)
        const underlyingTokenOffset = totalDepositsOffset + 8;
        const underlyingTokenBytes = data.slice(underlyingTokenOffset, underlyingTokenOffset + 32);
        const underlyingToken = new PublicKey(underlyingTokenBytes);
        console.log('- Underlying Token:', underlyingToken.toBase58());
        
        // Yield token mint (32 bytes)
        const yieldTokenMintOffset = underlyingTokenOffset + 32;
        const yieldTokenMintBytes = data.slice(yieldTokenMintOffset, yieldTokenMintOffset + 32);
        const yieldTokenMint = new PublicKey(yieldTokenMintBytes);
        console.log('- Yield Token Mint:', yieldTokenMint.toBase58());
        
        // Is active (1 byte)
        const isActiveOffset = yieldTokenMintOffset + 32;
        const isActive = data[isActiveOffset] === 1;
        console.log('- Is Active:', isActive ? '✅ Oui' : '❌ Non');
        
        // Timestamps (i64 each)
        const createdAtOffset = isActiveOffset + 1;
        const createdAt = data.readBigInt64LE(createdAtOffset);
        const lastUpdateOffset = createdAtOffset + 8;
        const lastUpdate = data.readBigInt64LE(lastUpdateOffset);
        
        console.log('- Created At:', new Date(Number(createdAt) * 1000).toISOString());
        console.log('- Last Update:', new Date(Number(lastUpdate) * 1000).toISOString());
        
        console.log('\n🎉 STRATÉGIE 1 DÉCODÉE AVEC SUCCÈS!');
        console.log('========================================');
        console.log(`✅ "${name}" (ID: ${readStrategyId})`);
        console.log(`📈 APY: ${(Number(apy) / 100).toFixed(2)}%`);
        console.log(`💰 Total déposé: ${(Number(totalDeposits) / 1e9).toFixed(4)} SOL`);
        console.log(`🟢 Statut: ${isActive ? 'Actif' : 'Inactif'}`);
        
        if (Number(createdAt) > 0) {
            console.log(`📅 Créé le: ${new Date(Number(createdAt) * 1000).toLocaleDateString()}`);
        } else {
            console.log(`📅 Timestamp de création non défini`);
        }
        
        // Check if the yield token mint exists
        console.log('\n🪙 Vérification du Yield Token Mint:');
        try {
            const yieldTokenInfo = await connection.getAccountInfo(yieldTokenMint);
            if (yieldTokenInfo) {
                console.log('✅ Yield Token Mint créé');
                console.log('- Data Length:', yieldTokenInfo.data.length, 'bytes');
                console.log('- Owner:', yieldTokenInfo.owner.toBase58());
            } else {
                console.log('❌ Yield Token Mint non trouvé');
            }
        } catch (err) {
            console.log('❌ Erreur lors de la vérification du Yield Token Mint:', err.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la lecture:', error.message);
        console.error(error.stack);
    }
}

readStrategy1Correct().catch(console.error); 