const { 
    Connection, 
    Keypair, 
    PublicKey, 
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction
} = require('@solana/web3.js');
const fs = require('fs');

async function createStrategyDirect() {
    console.log('🚀 Testing create_strategy with direct web3.js approach...');
    
    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');
    
    // Load keypair
    let adminKeypair;
    try {
        const keypairPath = require('os').homedir() + '/.config/solana/devnet.json';
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        adminKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
        console.log('✅ Loaded admin keypair:', adminKeypair.publicKey.toBase58());
    } catch (err) {
        console.log('❌ Could not load keypair, generating new one...');
        adminKeypair = Keypair.generate();
        console.log('⚠️  Generated keypair:', adminKeypair.publicKey.toBase58());
        console.log('⚠️  This keypair may not have SOL for transaction fees');
    }
    
    // Strategy parameters
    const strategyId = 1;
    const name = "Direct Web3 Strategy";
    const apyBasisPoints = 1000; // 10%
    
    console.log('\n📋 Strategy Parameters:');
    console.log('Strategy ID:', strategyId);
    console.log('Name:', name);
    console.log('APY:', apyBasisPoints, 'basis points (10%)');
    
    try {
        // Derive PDAs using the correct seeds
        const [strategyPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("strategy"), 
                Buffer.from([strategyId, 0, 0, 0, 0, 0, 0, 0]) // u64 little endian
            ],
            programId
        );
        
        const [strategyCounterPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("strategy_counter")],
            programId
        );
        
        const [yieldTokenMintPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("yield_token"), 
                Buffer.from([strategyId, 0, 0, 0, 0, 0, 0, 0]) // u64 little endian
            ],
            programId
        );
        
        console.log('\n🔑 Derived PDAs:');
        console.log('Strategy PDA:', strategyPda.toBase58());
        console.log('Strategy Counter PDA:', strategyCounterPda.toBase58());
        console.log('Yield Token Mint PDA:', yieldTokenMintPda.toBase58());
        
        // Create instruction data buffer
        // Discriminator for create_strategy: [152, 160, 107, 148, 245, 190, 127, 224]
        const discriminator = Buffer.from([152, 160, 107, 148, 245, 190, 127, 224]);
        
        // Encode parameters - matching Rust types exactly
        const nameBuffer = Buffer.from(name, 'utf8');
        const nameLength = Buffer.alloc(4);
        nameLength.writeUInt32LE(nameBuffer.length, 0);
        
        // APY as u64 (8 bytes), not u16!
        const apyBuffer = Buffer.alloc(8);
        apyBuffer.writeBigUInt64LE(BigInt(apyBasisPoints), 0);
        
        const strategyIdBuffer = Buffer.alloc(8);
        strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
        
        // Combine instruction data
        const instructionData = Buffer.concat([
            discriminator,
            nameLength,
            nameBuffer,
            apyBuffer,
            strategyIdBuffer
        ]);
        
        console.log('\n🔧 Instruction Data:');
        console.log('Discriminator:', Array.from(discriminator));
        console.log('Name length:', nameBuffer.length);
        console.log('Name:', name);
        console.log('APY (u64):', apyBasisPoints);
        console.log('Strategy ID (u64):', strategyId);
        console.log('Total data length:', instructionData.length, 'bytes');
        console.log('Expected: 8 (discriminator) + 4 (name_len) + name_len + 8 (apy) + 8 (strategy_id)');
        
        // Create instruction
        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: true }, // admin
                { pubkey: strategyPda, isSigner: false, isWritable: true }, // strategy
                { pubkey: strategyCounterPda, isSigner: false, isWritable: true }, // strategy_counter
                { pubkey: new PublicKey("So11111111111111111111111111111111111111112"), isSigner: false, isWritable: false }, // underlying_token (SOL)
                { pubkey: yieldTokenMintPda, isSigner: false, isWritable: true }, // yield_token_mint
                { pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), isSigner: false, isWritable: false }, // token_program
                { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false }, // system_program
                { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false }, // rent
            ],
            programId: programId,
            data: instructionData,
        });
        
        // Create and send transaction
        const transaction = new Transaction().add(instruction);
        
        console.log('\n📤 Sending transaction...');
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [adminKeypair],
            { commitment: 'confirmed' }
        );
        
        console.log('\n✅ Transaction successful!');
        console.log('Signature:', signature);
        
        // Verify the strategy was created
        setTimeout(async () => {
            try {
                const accountInfo = await connection.getAccountInfo(strategyPda);
                if (accountInfo) {
                    console.log('\n📊 Strategy Account Created:');
                    console.log('Data length:', accountInfo.data.length);
                    console.log('Owner:', accountInfo.owner.toBase58());
                    console.log('Lamports:', accountInfo.lamports);
                } else {
                    console.log('❌ Strategy account not found');
                }
            } catch (err) {
                console.log('❌ Error fetching strategy account:', err.message);
            }
        }, 3000);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.logs) {
            console.log('\n📝 Program Logs:');
            error.logs.forEach(log => console.log('  ', log));
        }
    }
}

createStrategyDirect().catch(console.error); 