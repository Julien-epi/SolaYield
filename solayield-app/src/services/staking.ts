import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { solaYieldProgram, SolaYieldProgram } from './program';

export interface Strategy {
  id: string;
  name: string;
  token: string;
  apy: number;
  minDeposit: number;
  totalDeposits: number;
  tvl: number;
  isActive: boolean;
  strategyId: number;
  address: PublicKey;
  underlyingToken: PublicKey;
  yieldTokenMint: PublicKey;
}

export interface UserPosition {
  id: string;
  strategyId: string;
  amount: number;
  yieldTokens: number;
  startDate: Date;
  rewards: number;
  lastClaim: Date;
  totalClaimed: number;
}

export interface StakingPool {
  id: string;
  name: string;
  token: string;
  apy: number;
  tvl: number;
  minStake: number;
  isActive: boolean;
  strategyId: number;
  address: PublicKey;
}

export const stakingService = {
  // Récupérer toutes les stratégies
  getStrategies: async (): Promise<Strategy[]> => {
    try {
      // Vérifier si le programme est initialisé
      const program = solaYieldProgram.getProgram();
      console.log(program);
      
      const connection = solaYieldProgram.getConnection();
      
      // Récupérer tous les comptes Strategy
      const strategies = await program.account.strategy.all();
      console.log(strategies);
      
      
      return strategies.map((strategy: any, index: number) => ({
        id: strategy.account.strategyId.toString(),
        name: strategy.account.name,
        token: 'SOL', // À adapter selon le token sous-jacent
        apy: Number(strategy.account.apy) / 100, // Convertir de basis points
        minDeposit: 0.1, // Valeur par défaut
        totalDeposits: Number(strategy.account.totalDeposits) / 1e9, // Convertir de lamports
        tvl: Number(strategy.account.totalDeposits) / 1e9,
        isActive: strategy.account.isActive,
        strategyId: Number(strategy.account.strategyId),
        address: strategy.publicKey,
        underlyingToken: strategy.account.underlyingToken,
        yieldTokenMint: strategy.account.yieldTokenMint
      }));
    } catch (error) {
      console.warn('Program not initialized or no strategies found, returning demo data:', error);
      // Retourner des données de démonstration
      return [
        {
          id: '1',
          name: 'SOL Staking Pool',
          token: 'SOL',
          apy: 8.5,
          minDeposit: 0.1,
          totalDeposits: 1250.5,
          tvl: 1250.5,
          isActive: true,
          strategyId: 1,
          address: new PublicKey('11111111111111111111111111111111'),
          underlyingToken: new PublicKey('11111111111111111111111111111111'),
          yieldTokenMint: new PublicKey('11111111111111111111111111111111')
        },
        {
          id: '2',
          name: 'USDC Lending Pool',
          token: 'USDC',
          apy: 12.3,
          minDeposit: 10,
          totalDeposits: 8750.25,
          tvl: 8750.25,
          isActive: true,
          strategyId: 2,
          address: new PublicKey('11111111111111111111111111111111'),
          underlyingToken: new PublicKey('11111111111111111111111111111111'),
          yieldTokenMint: new PublicKey('11111111111111111111111111111111')
        }
      ];
    }
  },

  // Récupérer les positions d'un utilisateur
  getUserPositions: async (userPubkey: PublicKey): Promise<UserPosition[]> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Récupérer toutes les positions de l'utilisateur
      const positions = await program.account.userPosition.all([
        {
          memcmp: {
            offset: 8, // Discriminator
            bytes: userPubkey.toBase58()
          }
        }
      ]);

      return positions.map((position: any) => ({
        id: position.account.positionId.toString(),
        strategyId: position.account.strategy.toString(),
        amount: Number(position.account.depositedAmount) / 1e9,
        yieldTokens: Number(position.account.yieldTokensMinted) / 1e9,
        startDate: new Date(Number(position.account.depositTime) * 1000),
        rewards: 0, // Calculé séparément
        lastClaim: new Date(Number(position.account.lastYieldClaim) * 1000),
        totalClaimed: Number(position.account.totalYieldClaimed) / 1e9
      }));
    } catch (error) {
      console.warn('Program not initialized or no positions found:', error);
      return [];
    }
  },

  // Déposer dans une stratégie
  depositToStrategy: async (
    wallet: any,
    strategyId: number,
    amount: number
  ): Promise<string> => {
    try {
      const program = solaYieldProgram.getProgram();
      const connection = solaYieldProgram.getConnection();
      console.log(program, connection);
      
      // D'abord, récupérer la stratégie réelle depuis la blockchain
      const allStrategies = await program.account.strategy.all();
      const strategyData = allStrategies.find((s: any) => s.account.strategyId.toNumber() === strategyId);
      
      if (!strategyData) {
        throw new Error(`Strategy with ID ${strategyId} not found`);
      }
      
      // Utiliser l'adresse réelle de la stratégie pour récupérer les données
      const realStrategyAddress = strategyData.publicKey;
      console.log("Real strategy address:", realStrategyAddress.toBase58());
      
      // Mais calculer le PDA pour la transaction (le contrat s'attend à ça)
      const [strategyPDA] = SolaYieldProgram.findStrategyPDA(strategyId);
      console.log("Strategy PDA expected by contract:", strategyPDA.toBase58());
      
      // Trouver les PDAs
      const [userPositionPDA] = SolaYieldProgram.findUserPositionPDA(wallet.publicKey, strategyPDA);
      console.log("User Position PDA:", userPositionPDA.toBase58());
      
      // Calculer le strategy vault PDA
      const [strategyVaultPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy_vault"),
          new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)
        ],
        solaYieldProgram.getProgramId()
      );
      console.log("Strategy Vault PDA:", strategyVaultPDA.toBase58());
      
      // Utiliser les infos de la stratégie déjà récupérées
      const strategy = strategyData.account;
      
      console.log("Strategy underlying token:", strategy.underlyingToken.toBase58());
      console.log("Strategy yield token mint:", strategy.yieldTokenMint.toBase58());
      
      // Utiliser le yield token mint RÉEL de la stratégie, pas le calculé
      const yieldTokenMint = strategy.yieldTokenMint;
      console.log("Using REAL yield token mint:", yieldTokenMint.toBase58());
      
      // Créer les comptes de tokens associés si nécessaire
      const userUnderlyingToken = await getAssociatedTokenAddress(
        strategy.underlyingToken,
        wallet.publicKey
      );
      
      const userYieldTokenAccount = await getAssociatedTokenAddress(
        yieldTokenMint,
        wallet.publicKey
      );

      console.log("User underlying token account:", userUnderlyingToken.toBase58());
      console.log("User yield token account:", userYieldTokenAccount.toBase58());

      // Instructions pour créer les comptes si nécessaire
      const instructions = [];
      
      // Vérifier si le compte underlying token existe
      const underlyingTokenAccountInfo = await connection.getAccountInfo(userUnderlyingToken);
      if (!underlyingTokenAccountInfo) {
        console.log("Creating underlying token account...");
        instructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userUnderlyingToken,
            wallet.publicKey,
            strategy.underlyingToken
          )
        );
      } else {
        console.log("Underlying token account already exists");
      }
      
      // Vérifier si le compte yield token existe
      const yieldTokenAccountInfo = await connection.getAccountInfo(userYieldTokenAccount);
      if (!yieldTokenAccountInfo) {
        console.log("Creating yield token account...");
        instructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userYieldTokenAccount,
            wallet.publicKey,
            yieldTokenMint
          )
        );
      } else {
        console.log("Yield token account already exists");
      }
      
      console.log(`Will execute ${instructions.length} pre-instructions`);
      instructions.forEach((ix, i) => {
        console.log(`Pre-instruction ${i}:`, ix);
      });

      // Convertir le montant en lamports
      const amountLamports = new anchor.BN(amount * 1e9);

      // Appeler l'instruction deposit
      const tx = await (program.methods as any)
        .depositToStrategy(amountLamports, new anchor.BN(strategyId))
        .accounts({
          user: wallet.publicKey,
          strategy: strategyPDA,
          userPosition: userPositionPDA,
          underlyingTokenMint: strategy.underlyingToken,
          userUnderlyingToken,
          strategyVault: strategyVaultPDA,
          yieldTokenMint: yieldTokenMint,
          userYieldTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .preInstructions(instructions)
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error depositing to strategy:', error);
      throw error;
    }
  },

  // Réclamer les rewards
  claimYield: async (
    wallet: any,
    strategyId: number
  ): Promise<string> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Trouver les PDAs
      const [strategyPDA] = SolaYieldProgram.findStrategyPDA(strategyId);
      const [userPositionPDA] = SolaYieldProgram.findUserPositionPDA(wallet.publicKey, strategyPDA);
      
      // Récupérer les infos de la stratégie
      const strategy = await program.account.strategy.fetch(strategyPDA);
      
      const userTokenAccount = await getAssociatedTokenAddress(
        strategy.underlyingToken,
        wallet.publicKey
      );

      const tx = await (program.methods as any)
        .claimYield(new anchor.BN(strategyId))
        .accounts({
          user: wallet.publicKey,
          strategy: strategyPDA,
          userPosition: userPositionPDA,
          underlyingTokenMint: strategy.underlyingToken,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error claiming yield:', error);
      throw error;
    }
  },

  // Retirer de la stratégie
  withdrawFromStrategy: async (
    wallet: any,
    strategyId: number,
    amount: number
  ): Promise<string> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Trouver les PDAs
      const [strategyPDA] = SolaYieldProgram.findStrategyPDA(strategyId);
      const [userPositionPDA] = SolaYieldProgram.findUserPositionPDA(wallet.publicKey, strategyPDA);
      
      // Récupérer les infos de la stratégie
      const strategy = await program.account.strategy.fetch(strategyPDA);
      
      const userTokenAccount = await getAssociatedTokenAddress(
        strategy.underlyingToken,
        wallet.publicKey
      );

      // Convertir le montant en lamports
      const amountLamports = new anchor.BN(amount * 1e9);

      const tx = await (program.methods as any)
        .withdrawFromStrategy(amountLamports, new anchor.BN(strategyId))
        .accounts({
          user: wallet.publicKey,
          strategy: strategyPDA,
          userPosition: userPositionPDA,
          underlyingTokenMint: strategy.underlyingToken,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error withdrawing from strategy:', error);
      throw error;
    }
  },

  // Initialiser la connexion au programme
  initializeProgram: async (wallet: any): Promise<void> => {
    try {
      await solaYieldProgram.initializeProgram(wallet);
    } catch (error) {
      console.error('Error initializing program:', error);
      throw error;
    }
  },

  // Récupérer les pools de staking (alias pour getStrategies avec format adapté)
  getPools: async (): Promise<StakingPool[]> => {
    try {
      const strategies = await stakingService.getStrategies();
      
      return strategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        token: strategy.token,
        apy: strategy.apy,
        tvl: strategy.tvl,
        minStake: strategy.minDeposit,
        isActive: strategy.isActive,
        strategyId: strategy.strategyId,
        address: strategy.address
      }));
    } catch (error) {
      console.warn('Error fetching pools:', error);
      return [];
    }
  },



  // Fonction stake pour l'interface utilisateur
  stake: async (
    poolId: string,
    amount: number,
    userPublicKey: PublicKey
  ): Promise<{ success: boolean; error?: string; txHash?: string }> => {
    try {
      // Récupérer le wallet depuis le contexte (simulation)
      const wallet = { publicKey: userPublicKey };
      
      // Convertir poolId en strategyId
      const strategyId = parseInt(poolId);
      console.log(wallet, poolId, amount, userPublicKey, strategyId);
      
      // Appeler depositToStrategy
      const txHash = await stakingService.depositToStrategy(wallet, strategyId, amount);
      
      return {
        success: true,
        txHash
      };
    } catch (error) {
      console.error('Error staking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
      };
    }
  }
}; 