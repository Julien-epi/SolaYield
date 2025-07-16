const anchor = require('@coral-xyz/anchor');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function createStrategy() {
    // Setup
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Load the deployed IDL (compatible format)
    const idlPath = './deployed-idl.json';
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    
    const programId = new PublicKey('BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');
    
    // Admin wallet - load from file or generate new one
    let adminKeypair;
    try {
        // Try to load from Solana config (standard location)
        const keypairPath = require('os').homedir() + '/.config/solana/devnet.json';
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        adminKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    } catch (err) {
        console.log('Could not load keypair from file, generating new one...');
        adminKeypair = Keypair.generate();
    }
    
    const wallet = new anchor.Wallet(adminKeypair);
    const provider = new anchor.AnchorProvider(connection, wallet, { 
        commitment: 'confirmed' 
    });
    anchor.setProvider(provider);
    
    const program = new anchor.Program(idl, programId, provider);
    
    // Strategy parameters
    const strategyId = new anchor.BN(1);
    const name = "USDC Yield Strategy";
    const apyBasisPoints = 1000; // 10%
    
    console.log('Creating strategy with fresh IDL...');
    console.log('Strategy ID:', strategyId.toString());
    console.log('Name:', name);
    console.log('APY:', apyBasisPoints, 'basis points (10%)');
    console.log('Admin:', adminKeypair.publicKey.toBase58());
    
    try {
        // Derive PDAs
        const [strategyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("strategy"), strategyId.toArrayLike(Buffer, "le", 8)],
            programId
        );
        
        const [strategyCounterPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("strategy_counter")],
            programId
        );
        
        const [yieldTokenMintPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("yield_token"), strategyId.toArrayLike(Buffer, "le", 8)],
            programId
        );
        
        // SOL native token
        const underlyingToken = new PublicKey("So11111111111111111111111111111111111111112");
        
        console.log('\nDerived PDAs:');
        console.log('Strategy PDA:', strategyPda.toBase58());
        console.log('Strategy Counter PDA:', strategyCounterPda.toBase58());
        console.log('Yield Token Mint PDA:', yieldTokenMintPda.toBase58());
        
        // Create strategy
        const tx = await program.methods
            .createStrategy(name, apyBasisPoints, strategyId)
            .accounts({
                admin: adminKeypair.publicKey,
                strategy: strategyPda,
                strategyCounter: strategyCounterPda,
                underlyingToken: underlyingToken,
                yieldTokenMint: yieldTokenMintPda,
                tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([adminKeypair])
            .rpc();
            
        console.log('\n✅ Strategy created successfully!');
        console.log('Transaction signature:', tx);
        
        // Verify the strategy was created
        setTimeout(async () => {
            try {
                const strategyAccount = await program.account.strategy.fetch(strategyPda);
                console.log('\n📊 Strategy Details:');
                console.log('Name:', strategyAccount.name);
                console.log('APY Basis Points:', strategyAccount.apyBasisPoints);
                console.log('Strategy ID:', strategyAccount.strategyId.toString());
                console.log('Active:', strategyAccount.isActive);
                console.log('Admin:', strategyAccount.admin.toBase58());
            } catch (err) {
                console.log('❌ Error fetching strategy:', err.message);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error creating strategy:', error);
        if (error.logs) {
            console.log('Program logs:', error.logs);
        }
    }
}

createStrategy().catch(console.error); 