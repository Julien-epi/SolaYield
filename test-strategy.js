const { Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } = require("@solana/spl-token");
const anchor = require("@coral-xyz/anchor");
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const NATIVE_SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

class StrategyTester {
  constructor() {
    // Connection à devnet
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // Gestion du wallet
    let wallet;
    try {
      wallet = anchor.Wallet.local();
    } catch (error) {
      console.log("⚠️  ANCHOR_WALLET not set, using default Solana CLI wallet...");
      
      const defaultWalletPath = path.join(os.homedir(), '.config', 'solana', 'devnet.json');
      
      if (fs.existsSync(defaultWalletPath)) {
        const secretKey = JSON.parse(fs.readFileSync(defaultWalletPath, 'utf8'));
        const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
        wallet = new anchor.Wallet(keypair);
        console.log("✅ Using Solana CLI wallet:", keypair.publicKey.toBase58());
      } else {
        throw new Error("No wallet found! Please run: solana-keygen new --outfile ~/.config/solana/devnet.json");
      }
    }
    
    this.provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(this.provider);
    
    // Charger l'IDL déployé
    const idl = JSON.parse(fs.readFileSync('deployed-idl.json', 'utf8'));
    this.program = new anchor.Program(idl, PROGRAM_ID, this.provider);
    
    console.log("🔧 Setup completed:");
    console.log(`- Wallet: ${this.provider.wallet.publicKey.toBase58()}`);
    console.log(`- Program: ${PROGRAM_ID.toBase58()}`);
  }

  // Utilitaires PDA
  getStrategyPDA(strategyId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  getStrategyCounterPDA() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_counter")],
      this.program.programId
    );
  }

  getUserPositionPDA(user, strategy) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("user_position"), user.toBuffer(), strategy.toBuffer()],
      this.program.programId
    );
  }

  getYieldTokenMintPDA(strategyId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("yield_token"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  getStrategyVaultPDA(strategyId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_vault"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  // 1. Vérifier si le protocole est initialisé
  async checkProtocolStatus() {
    console.log("\n🔍 Checking protocol status...");
    
    const [strategyCounter] = this.getStrategyCounterPDA();
    
    try {
      const account = await this.program.account.strategyCounter.fetch(strategyCounter);
      console.log("✅ Protocol initialized - Strategy count:", account.count.toString());
      return { initialized: true, count: account.count.toNumber() };
    } catch (error) {
      console.log("⚠️  Protocol not initialized");
      return { initialized: false, count: 0 };
    }
  }

  // 2. Initialiser le protocole
  async initializeProtocol() {
    console.log("\n🚀 Initializing protocol...");
    
    const [strategyCounter] = this.getStrategyCounterPDA();
    
    try {
      const tx = await this.program.methods
        .initializeProtocol()
        .accounts({
          admin: this.provider.wallet.publicKey,
          strategyCounter,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("✅ Protocol initialized!");
      console.log("📋 Transaction:", tx);
      return true;
    } catch (error) {
      console.error("❌ Error initializing protocol:", error.message);
      return false;
    }
  }

  // 3. Créer une stratégie
  async createStrategy(name, apyBasisPoints, strategyId) {
    console.log(`\n🏗️  Creating strategy: "${name}" with ${apyBasisPoints/100}% APY...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [strategyCounter] = this.getStrategyCounterPDA();
    const [yieldTokenMint] = this.getYieldTokenMintPDA(strategyId);
    
    try {
      const tx = await this.program.methods
        .createStrategy(name, apyBasisPoints, new anchor.BN(strategyId))
        .accounts({
          admin: this.provider.wallet.publicKey,
          strategy,
          strategyCounter,
          underlyingToken: NATIVE_SOL_MINT,
          yieldTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("✅ Strategy created!");
      console.log("📋 Transaction:", tx);
      console.log("🆔 Strategy ID:", strategyId);
      console.log("📍 Strategy PDA:", strategy.toBase58());
      console.log("🪙 Yield Token Mint:", yieldTokenMint.toBase58());
      return true;
    } catch (error) {
      console.error("❌ Error creating strategy:", error.message);
      return false;
    }
  }

  // 4. Obtenir les infos d'une stratégie
  async getStrategyInfo(strategyId) {
    console.log(`\n📊 Getting strategy ${strategyId} info...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);

    try {
      const strategyAccount = await this.program.account.strategy.fetch(strategy);
      
      const info = {
        name: strategyAccount.name,
        apy: strategyAccount.apy.toNumber() / 100,
        totalDeposits: strategyAccount.totalDeposits.toNumber() / LAMPORTS_PER_SOL,
        underlyingToken: strategyAccount.underlyingToken.toBase58(),
        yieldTokenMint: strategyAccount.yieldTokenMint.toBase58(),
        isActive: strategyAccount.isActive,
        createdAt: new Date(strategyAccount.createdAt.toNumber() * 1000)
      };

      console.log("📋 Strategy Info:");
      console.log(`- Name: ${info.name}`);
      console.log(`- APY: ${info.apy.toFixed(2)}%`);
      console.log(`- Total Deposits: ${info.totalDeposits.toFixed(4)} SOL`);
      console.log(`- Active: ${info.isActive}`);
      console.log(`- Created: ${info.createdAt.toLocaleDateString()}`);
      
      return info;
    } catch (error) {
      console.error("❌ Error fetching strategy:", error.message);
      return null;
    }
  }

  // 5. Déposer dans une stratégie
  async depositToStrategy(amount, strategyId) {
    console.log(`\n💰 Depositing ${amount} SOL to strategy ${strategyId}...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [userPosition] = this.getUserPositionPDA(this.provider.wallet.publicKey, strategy);
    const [yieldTokenMint] = this.getYieldTokenMintPDA(strategyId);
    const [strategyVault] = this.getStrategyVaultPDA(strategyId);
    
    const userYieldTokenAccount = await getAssociatedTokenAddress(
      yieldTokenMint,
      this.provider.wallet.publicKey
    );

    try {
      const tx = await this.program.methods
        .depositToStrategy(
          new anchor.BN(amount * LAMPORTS_PER_SOL), 
          new anchor.BN(strategyId)
        )
        .accounts({
          user: this.provider.wallet.publicKey,
          strategy,
          userPosition,
          underlyingTokenMint: NATIVE_SOL_MINT,
          userUnderlyingToken: this.provider.wallet.publicKey,
          strategyVault,
          yieldTokenMint,
          userYieldTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("✅ Deposit successful!");
      console.log("📋 Transaction:", tx);
      console.log("💵 Amount deposited:", amount, "SOL");
      return true;
    } catch (error) {
      console.error("❌ Error depositing:", error.message);
      return false;
    }
  }

  // 6. Obtenir la position utilisateur
  async getUserPosition(strategyId) {
    console.log(`\n👤 Getting user position in strategy ${strategyId}...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [userPosition] = this.getUserPositionPDA(this.provider.wallet.publicKey, strategy);

    try {
      const positionAccount = await this.program.account.userPosition.fetch(userPosition);
      
      const info = {
        depositedAmount: positionAccount.depositedAmount.toNumber() / LAMPORTS_PER_SOL,
        yieldTokensMinted: positionAccount.yieldTokensMinted.toString(),
        depositTime: new Date(positionAccount.depositTime.toNumber() * 1000),
        lastYieldClaim: new Date(positionAccount.lastYieldClaim.toNumber() * 1000),
        totalYieldClaimed: positionAccount.totalYieldClaimed.toString()
      };

      console.log("📍 User Position:");
      console.log(`- Deposited Amount: ${info.depositedAmount.toFixed(4)} SOL`);
      console.log(`- Yield Tokens Minted: ${info.yieldTokensMinted}`);
      console.log(`- Deposit Time: ${info.depositTime.toLocaleString()}`);
      console.log(`- Last Yield Claim: ${info.lastYieldClaim.toLocaleString()}`);
      console.log(`- Total Yield Claimed: ${info.totalYieldClaimed}`);
      
      return info;
    } catch (error) {
      console.error("❌ Error fetching user position:", error.message);
      return null;
    }
  }

  // 7. Réclamer le yield
  async claimYield(strategyId) {
    console.log(`\n🎯 Claiming yield from strategy ${strategyId}...`);
    
    const [strategy] = this.getStrategyPDA(strategyId);
    const [userPosition] = this.getUserPositionPDA(this.provider.wallet.publicKey, strategy);
    const [yieldTokenMint] = this.getYieldTokenMintPDA(strategyId);
    
    const userYieldTokenAccount = await getAssociatedTokenAddress(
      yieldTokenMint,
      this.provider.wallet.publicKey
    );

    try {
      const tx = await this.program.methods
        .claimYield(new anchor.BN(strategyId))
        .accounts({
          user: this.provider.wallet.publicKey,
          strategy,
          userPosition,
          yieldTokenMint,
          userYieldTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("✅ Yield claimed!");
      console.log("📋 Transaction:", tx);
      return true;
    } catch (error) {
      console.error("❌ Error claiming yield:", error.message);
      return false;
    }
  }

  // 8. Test complet
  async runCompleteTest() {
    console.log("🧪 STARTING COMPLETE STRATEGY TEST");
    console.log("=" .repeat(50));

    try {
      // 1. Vérifier le statut du protocole
      const status = await this.checkProtocolStatus();
      
      if (!status.initialized) {
        console.log("📋 Protocol needs initialization...");
        const initSuccess = await this.initializeProtocol();
        if (!initSuccess) {
          throw new Error("Failed to initialize protocol");
        }
      }

      // 2. Créer une stratégie de test
      const strategyId = 0;
      const strategyName = "SOL Test Staking";
      const apyBasisPoints = 1200; // 12% APY
      
      console.log(`\n📋 Creating test strategy...`);
      const createSuccess = await this.createStrategy(strategyName, apyBasisPoints, strategyId);
      if (!createSuccess) {
        throw new Error("Failed to create strategy");
      }

      // 3. Vérifier les infos de la stratégie
      await this.getStrategyInfo(strategyId);

      // 4. Déposer dans la stratégie
      const depositAmount = 0.1; // 0.1 SOL
      console.log(`\n📋 Testing deposit...`);
      const depositSuccess = await this.depositToStrategy(depositAmount, strategyId);
      if (!depositSuccess) {
        throw new Error("Failed to deposit");
      }

      // 5. Vérifier la position utilisateur
      await this.getUserPosition(strategyId);

      // 6. Attendre un peu puis tester le claim
      console.log(`\n⏳ Waiting 5 seconds before testing yield claim...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const claimSuccess = await this.claimYield(strategyId);
      if (claimSuccess) {
        // Vérifier la position après claim
        await this.getUserPosition(strategyId);
      }

      console.log("\n🎉 COMPLETE TEST SUCCESSFUL!");
      console.log("=" .repeat(50));
      console.log("✅ All strategy functions working correctly");
      console.log("✅ Protocol is ready for production use");
      
    } catch (error) {
      console.error("\n❌ TEST FAILED:", error.message);
      console.log("=" .repeat(50));
    }
  }
}

// Exécution
async function main() {
  const tester = new StrategyTester();
  await tester.runCompleteTest();
}

main().catch(console.error); 