const { Connection, PublicKey } = require('@solana/web3.js');

async function debugStrategy1() {
    console.log('🔍 DEBUG DE LA STRATÉGIE 1 - DONNÉES BRUTES');
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
        
        const data = accountInfo.data;
        
        // Show first 100 bytes in hex and ASCII
        console.log('\n🔍 Premiers 100 bytes (hex):');
        for (let i = 0; i < Math.min(100, data.length); i += 16) {
            const chunk = data.slice(i, i + 16);
            const hex = chunk.toString('hex').match(/.{2}/g).join(' ');
            const ascii = chunk.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
            console.log(`${i.toString(16).padStart(4, '0')}: ${hex.padEnd(47)} | ${ascii}`);
        }
        
        // Try to understand the structure
        console.log('\n🔍 Analyse de la structure:');
        
        // Discriminator (8 bytes)
        const discriminator = data.slice(0, 8);
        console.log('- Discriminator (0-7):', discriminator.toString('hex'));
        
        // Anchor accounts usually have a discriminator, then fields
        // Let's try different offsets to see where the string might be
        console.log('\n🔍 Recherche de la chaîne "Direct Web3 Strategy":');
        const searchString = 'Direct Web3 Strategy';
        const searchBuffer = Buffer.from(searchString, 'utf8');
        
        for (let i = 0; i < data.length - searchBuffer.length; i++) {
            if (data.slice(i, i + searchBuffer.length).equals(searchBuffer)) {
                console.log(`✅ Trouvé "${searchString}" à l'offset ${i} (0x${i.toString(16)})`);
                
                // Check if there's a length prefix before it
                if (i >= 4) {
                    const possibleLength = data.readUInt32LE(i - 4);
                    console.log(`  - Length prefix à ${i-4}: ${possibleLength}`);
                    if (possibleLength === searchString.length) {
                        console.log(`  ✅ Length prefix correct!`);
                    }
                }
                break;
            }
        }
        
        // Try to read from different starting positions
        console.log('\n🔍 Tentatives de lecture à différents offsets:');
        
        for (let offset = 8; offset <= 50; offset += 4) {
            try {
                if (offset + 4 <= data.length) {
                    const len = data.readUInt32LE(offset);
                    if (len > 0 && len < 100 && offset + 4 + len <= data.length) {
                        const str = data.slice(offset + 4, offset + 4 + len).toString('utf8');
                        if (str.includes('Direct') || str.includes('Strategy')) {
                            console.log(`  ✅ Offset ${offset}: length=${len}, string="${str}"`);
                        }
                    }
                }
            } catch (e) {
                // Continue searching
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du debug:', error.message);
    }
}

debugStrategy1().catch(console.error); 