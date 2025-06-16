import { PublicKey } from '@solana/web3.js';

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
    maturityDate: new Date('2024-12-31'),
    status: 'active'
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
    await delay(500);
    return mockStats;
  },

  // Récupérer les positions actives
  getPositions: async (walletAddress: PublicKey): Promise<Position[]> => {
    await delay(500);
    return mockPositions;
  },

  // Récupérer les tokens de yield détenus
  getYieldTokens: async (walletAddress: PublicKey): Promise<YieldToken[]> => {
    await delay(500);
    return mockYieldTokens;
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
    await delay(500);
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
}; 