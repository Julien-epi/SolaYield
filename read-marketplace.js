const { Connection, PublicKey } = require('@solana/web3.js');

async function readMarketplace() {
    console.log('📊 LECTURE DE LA MARKETPLACE STRATÉGIE 1');
    console.log('=========================================');
    
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');
    
    // Calculer la PDA de la marketplace pour la Stratégie 1
    const strategyId = 1;
    const [strategyPda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("strategy"), 
            Buffer.from([strategyId, 0, 0, 0, 0, 0, 0, 0])
        ],
        programId
    );
    
    const [marketplacePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("marketplace"), strategyPda.toBuffer()],
        programId
    );
    
    console.log('📍 Adresses:');
    console.log('- Strategy PDA:', strategyPda.toBase58());
    console.log('- Marketplace PDA:', marketplacePda.toBase58());
    
    try {
        const accountInfo = await connection.getAccountInfo(marketplacePda);
        
        if (!accountInfo) {
            console.log('❌ Marketplace non trouvée');
            return;
        }
        
        console.log('\n✅ Marketplace trouvée!');
        console.log('- Taille des données:', accountInfo.data.length, 'bytes');
        console.log('- Owner:', accountInfo.owner.toBase58());
        console.log('- Lamports:', accountInfo.lamports);
        
        const data = accountInfo.data;
        
        // Décoder les données de la marketplace
        // Structure attendue (basée sur le struct Marketplace dans Rust):
        // - discriminator (8 bytes)
        // - admin (32 bytes)
        // - strategy (32 bytes)
        // - yield_token_mint (32 bytes)
        // - underlying_token_mint (32 bytes)
        // - total_volume (u64 - 8 bytes)
        // - total_trades (u64 - 8 bytes)
        // - best_bid_price (u64 - 8 bytes)
        // - best_ask_price (u64 - 8 bytes)
        // - trading_fee_bps (u16 - 2 bytes)
        // - is_active (bool - 1 byte)
        // - created_at (i64 - 8 bytes)
        // - marketplace_id (u64 - 8 bytes)
        
        let offset = 0;
        
        // Discriminator (8 bytes)
        const discriminator = data.slice(offset, offset + 8);
        offset += 8;
        console.log('- Discriminator:', discriminator.toString('hex'));
        
        // Admin (32 bytes)
        const adminBytes = data.slice(offset, offset + 32);
        const admin = new PublicKey(adminBytes);
        offset += 32;
        console.log('- Admin:', admin.toBase58());
        
        // Strategy (32 bytes)
        const strategyBytes = data.slice(offset, offset + 32);
        const strategy = new PublicKey(strategyBytes);
        offset += 32;
        console.log('- Strategy:', strategy.toBase58());
        
        // Yield Token Mint (32 bytes)
        const yieldTokenMintBytes = data.slice(offset, offset + 32);
        const yieldTokenMint = new PublicKey(yieldTokenMintBytes);
        offset += 32;
        console.log('- Yield Token Mint:', yieldTokenMint.toBase58());
        
        // Underlying Token Mint (32 bytes)
        const underlyingTokenMintBytes = data.slice(offset, offset + 32);
        const underlyingTokenMint = new PublicKey(underlyingTokenMintBytes);
        offset += 32;
        console.log('- Underlying Token Mint:', underlyingTokenMint.toBase58());
        
        // Total Volume (u64 - 8 bytes)
        const totalVolume = data.readBigUInt64LE(offset);
        offset += 8;
        console.log('- Total Volume:', totalVolume.toString(), 'lamports =', (Number(totalVolume) / 1e9).toFixed(4), 'SOL');
        
        // Total Trades (u64 - 8 bytes)
        const totalTrades = data.readBigUInt64LE(offset);
        offset += 8;
        console.log('- Total Trades:', totalTrades.toString());
        
        // Best Bid Price (u64 - 8 bytes)
        const bestBidPrice = data.readBigUInt64LE(offset);
        offset += 8;
        console.log('- Best Bid Price:', bestBidPrice.toString(), 'lamports');
        
        // Best Ask Price (u64 - 8 bytes)
        const bestAskPrice = data.readBigUInt64LE(offset);
        offset += 8;
        console.log('- Best Ask Price:', bestAskPrice.toString(), 'lamports');
        
        // Trading Fee BPS (u16 - 2 bytes)
        const tradingFeeBps = data.readUInt16LE(offset);
        offset += 2;
        console.log('- Trading Fee:', tradingFeeBps, 'basis points =', (tradingFeeBps / 100).toFixed(2) + '%');
        
        // Is Active (bool - 1 byte)
        const isActive = data[offset] === 1;
        offset += 1;
        console.log('- Is Active:', isActive ? '✅ Oui' : '❌ Non');
        
        // Created At (i64 - 8 bytes)
        const createdAt = data.readBigInt64LE(offset);
        offset += 8;
        console.log('- Created At:', new Date(Number(createdAt) * 1000).toISOString());
        
        // Marketplace ID (u64 - 8 bytes)
        const marketplaceId = data.readBigUInt64LE(offset);
        offset += 8;
        console.log('- Marketplace ID:', marketplaceId.toString());
        
        console.log('\n🎉 MARKETPLACE DÉCODÉE AVEC SUCCÈS!');
        console.log('========================================');
        console.log(`✅ Marketplace ID: ${marketplaceId}`);
        console.log(`📈 Frais de trading: ${(tradingFeeBps / 100).toFixed(2)}%`);
        console.log(`💰 Volume total: ${(Number(totalVolume) / 1e9).toFixed(4)} SOL`);
        console.log(`🔢 Nombre total de trades: ${totalTrades}`);
        console.log(`🟢 Statut: ${isActive ? 'Actif' : 'Inactif'}`);
        console.log(`📅 Créé le: ${new Date(Number(createdAt) * 1000).toLocaleDateString()}`);
        console.log(`🏪 Associé à la Stratégie: ${strategy.toBase58()}`);
        
        if (Number(bestBidPrice) > 0 || Number(bestAskPrice) > 0) {
            console.log('\n📊 Prix du marché:');
            if (Number(bestBidPrice) > 0) {
                console.log(`- Meilleure offre d'achat: ${(Number(bestBidPrice) / 1e9).toFixed(6)} SOL`);
            }
            if (Number(bestAskPrice) > 0) {
                console.log(`- Meilleure offre de vente: ${(Number(bestAskPrice) / 1e9).toFixed(6)} SOL`);
            }
        } else {
            console.log('\n📊 Aucun ordre actif sur le marché');
        }
        
        // Vérifier le compteur de marketplace
        const [marketplaceCounterPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("marketplace_counter")],
            programId
        );
        
        try {
            const counterAccount = await connection.getAccountInfo(marketplaceCounterPda);
            if (counterAccount) {
                // Le compteur commence après le discriminator (8 bytes)
                const count = counterAccount.data.readBigUInt64LE(8);
                console.log(`\n📊 Total marketplaces créées: ${count}`);
            }
        } catch (err) {
            console.log('⚠️  Impossible de lire le compteur de marketplace');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la lecture:', error.message);
        console.error(error.stack);
    }
}

readMarketplace().catch(console.error); 