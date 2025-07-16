import { PublicKey } from '@solana/web3.js';
import { solaYieldProgram } from './program';
import * as anchor from '@coral-xyz/anchor';

export interface DashboardStats {
  totalValueLocked: number;
  totalYieldEarned: number;
  activePositions: number;
  pendingRewards: number;
}

export interface Position {
  id: string;
  tokenSymbol: string;
  amount: number;
  value: number;
  apy: number;
  yieldEarned: number;
  startDate: Date;
  maturityDate: Date;
  status: 'active' | 'matured';
}

export interface YieldToken {
  id: string;
  symbol: string;
  amount: number;
  value: number;
  apy: number;
  maturityDate: Date;
}

// Simulation de données
const mockStats: DashboardStats = {
  totalValueLocked: 15000,
  totalYieldEarned: 1200,
  activePositions: 3,
  pendingRewards: 450
};

const mockPositions: Position[] = [
  {
    id: '1',
    tokenSymbol: 'SOL',
    amount: 100,
    value: 10000,
    apy: 12,
    yieldEarned: 800,
    startDate: new Date('2024-01-01'),
    maturityDate: new Date('2023-12-31'),
    status: 'matured'
  },
  {
    id: '2',
    tokenSymbol: 'USDC',
    amount: 5000,
    value: 5000,
    apy: 8,
    yieldEarned: 400,
    startDate: new Date('2024-02-01'),
    maturityDate: new Date('2024-12-31'),
    status: 'active'
  }
];

const mockYieldTokens: YieldToken[] = [
  {
    id: 'yt-sol-1',
    symbol: 'ySOL-2024',
    amount: 50,
    value: 5000,
    apy: 12,
    maturityDate: new Date('2024-12-31')
  },
  {
    id: 'yt-usdc-1',
    symbol: 'yUSDC-2024',
    amount: 2500,
    value: 2500,
    apy: 8,
    maturityDate: new Date('2024-12-31')
  }
];

// Simuler un délai réseau
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dashboardService = {
  // Récupérer les statistiques du dashboard
  getStats: async (walletAddress: PublicKey): Promise<DashboardStats> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Récupérer toutes les positions utilisateur
      const positions = await program.account.userPosition.all([
        {
          memcmp: {
            offset: 8, // discriminator
            bytes: walletAddress.toBase58(),
          },
        },
      ]);

      // Calculer les statistiques basées sur les vraies données
      let totalValueLocked = 0;
      let totalYieldEarned = 0;
      let pendingRewards = 0;
      
      for (const position of positions) {
        const positionData = position.account;
        totalValueLocked += positionData.depositedAmount.toNumber() / 1e9; // Convertir lamports en SOL
        totalYieldEarned += positionData.totalYieldClaimed.toNumber() / 1e9;
        
        // Calculer les récompenses en attente
        const currentTime = Math.floor(Date.now() / 1000);
        const timeElapsed = currentTime - positionData.lastYieldClaim.toNumber();
        
        // Récupérer les infos de la stratégie pour calculer le yield
        const strategyPDA = await program.account.strategy.fetch(positionData.strategy);
        const yearlyYield = (positionData.depositedAmount.toNumber() * strategyPDA.apy.toNumber()) / 10000;
        const pendingYield = (yearlyYield * timeElapsed) / (365 * 24 * 60 * 60);
        pendingRewards += pendingYield / 1e9;
      }

      return {
        totalValueLocked: totalValueLocked * 100, // Convertir en USD approximatif
        totalYieldEarned: totalYieldEarned * 100,
        activePositions: positions.length,
        pendingRewards: pendingRewards * 100
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      // Fallback sur les données mock en cas d'erreur
      return mockStats;
    }
  },

  // Récupérer les positions actives
  getPositions: async (walletAddress: PublicKey): Promise<Position[]> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Récupérer toutes les positions utilisateur
      const positions = await program.account.userPosition.all([
        {
          memcmp: {
            offset: 8, // discriminator
            bytes: walletAddress.toBase58(),
          },
        },
      ]);

      const formattedPositions: Position[] = [];
      
      for (const position of positions) {
        const positionData = position.account;
        
        // Récupérer les infos de la stratégie
        const strategyData = await program.account.strategy.fetch(positionData.strategy);
        
        // Calculer le yield gagné
        const currentTime = Math.floor(Date.now() / 1000);
        const timeElapsed = currentTime - positionData.depositTime.toNumber();
        const yearlyYield = (positionData.depositedAmount.toNumber() * strategyData.apy.toNumber()) / 10000;
        const yieldEarned = (yearlyYield * timeElapsed) / (365 * 24 * 60 * 60);
        
        formattedPositions.push({
          id: position.publicKey.toBase58(),
          tokenSymbol: 'SOL', // Pour le moment, toutes les stratégies utilisent SOL
          amount: positionData.depositedAmount.toNumber() / 1e9,
          value: (positionData.depositedAmount.toNumber() / 1e9) * 100, // Approximation USD
          apy: strategyData.apy.toNumber() / 100,
          yieldEarned: (yieldEarned + positionData.totalYieldClaimed.toNumber()) / 1e9,
          startDate: new Date(positionData.depositTime.toNumber() * 1000),
          maturityDate: new Date((positionData.depositTime.toNumber() + (365 * 24 * 60 * 60)) * 1000),
          status: strategyData.isActive ? 'active' : 'matured'
        });
      }

      return formattedPositions;
    } catch (error) {
      console.error('Erreur lors de la récupération des positions:', error);
      return mockPositions;
    }
  },

  // Récupérer les tokens de yield détenus
  getYieldTokens: async (walletAddress: PublicKey): Promise<YieldToken[]> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Récupérer toutes les positions utilisateur pour calculer les yield tokens
      const positions = await program.account.userPosition.all([
        {
          memcmp: {
            offset: 8, // discriminator
            bytes: walletAddress.toBase58(),
          },
        },
      ]);

      const yieldTokens: YieldToken[] = [];
      
      for (const position of positions) {
        const positionData = position.account;
        
        // Récupérer les infos de la stratégie
        const strategyData = await program.account.strategy.fetch(positionData.strategy);
        
        // Si l'utilisateur a des yield tokens mintés
        if (positionData.yieldTokensMinted.toNumber() > 0) {
          yieldTokens.push({
            id: `yt-${position.publicKey.toBase58()}`,
            symbol: `y${strategyData.name.substring(0, 10)}-2024`,
            amount: positionData.yieldTokensMinted.toNumber() / 1e9,
            value: (positionData.yieldTokensMinted.toNumber() / 1e9) * 100, // Approximation USD
            apy: strategyData.apy.toNumber() / 100,
            maturityDate: new Date((positionData.depositTime.toNumber() + (365 * 24 * 60 * 60)) * 1000)
          });
        }
      }

      return yieldTokens;
    } catch (error) {
      console.error('Erreur lors de la récupération des yield tokens:', error);
      return mockYieldTokens;
    }
  },

  // Récupérer l'historique des transactions
  getTransactionHistory: async (
    walletAddress: PublicKey,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    transactions: Array<{
      id: string;
      type: 'stake' | 'unstake' | 'buy' | 'sell';
      amount: number;
      token: string;
      timestamp: Date;
      status: 'completed' | 'pending' | 'failed';
    }>;
    total: number;
  }> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Récupérer toutes les positions utilisateur
      const positions = await program.account.userPosition.all([
        {
          memcmp: {
            offset: 8, // discriminator
            bytes: walletAddress.toBase58(),
          },
        },
      ]);

      const transactions: Array<{
        id: string;
        type: 'stake' | 'unstake' | 'buy' | 'sell';
        amount: number;
        token: string;
        timestamp: Date;
        status: 'completed' | 'pending' | 'failed';
      }> = [];
      
      // Créer des transactions basées sur les positions
      for (const position of positions) {
        const positionData = position.account;
        
        // Récupérer les infos de la stratégie
        const strategyData = await program.account.strategy.fetch(positionData.strategy);
        
        // Transaction de dépôt
        transactions.push({
          id: `deposit-${position.publicKey.toBase58()}`,
          type: 'stake',
          amount: positionData.depositedAmount.toNumber() / 1e9,
          token: 'SOL',
          timestamp: new Date(positionData.depositTime.toNumber() * 1000),
          status: 'completed'
        });
        
        // Si des yield tokens ont été réclamés
        if (positionData.totalYieldClaimed.toNumber() > 0) {
          transactions.push({
            id: `claim-${position.publicKey.toBase58()}`,
            type: 'buy',
            amount: positionData.totalYieldClaimed.toNumber() / 1e9,
            token: `y${strategyData.name.substring(0, 10)}`,
            timestamp: new Date(positionData.lastYieldClaim.toNumber() * 1000),
            status: 'completed'
          });
        }
      }

      // Trier par date décroissante
      transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Paginer
      const start = (page - 1) * limit;
      const paginatedTransactions = transactions.slice(start, start + limit);

      return {
        transactions: paginatedTransactions,
        total: transactions.length
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      // Fallback sur les données mock
      return {
        transactions: [
          {
            id: '1',
            type: 'stake',
            amount: 100,
            token: 'SOL',
            timestamp: new Date('2024-01-01'),
            status: 'completed'
          },
          {
            id: '2',
            type: 'buy',
            amount: 50,
            token: 'ySOL-2024',
            timestamp: new Date('2024-02-01'),
            status: 'completed'
          }
        ],
        total: 2
      };
    }
  }
}; 