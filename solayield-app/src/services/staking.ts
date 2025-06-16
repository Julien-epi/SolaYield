import { PublicKey } from '@solana/web3.js';

export interface StakingPool {
  id: string;
  name: string;
  token: string;
  apy: number;
  minStake: number;
  totalStaked: number;
  tvl: number;
}

export interface StakingPosition {
  id: string;
  poolId: string;
  amount: number;
  startDate: Date;
  rewards: number;
}

// Simulation de données
const pools: StakingPool[] = [
  {
    id: 'sol-pool',
    name: 'SOL Staking Pool',
    token: 'SOL',
    apy: 12,
    minStake: 1,
    totalStaked: 5000000,
    tvl: 5000000
  },
  {
    id: 'usdc-pool',
    name: 'USDC Lending Pool',
    token: 'USDC',
    apy: 8,
    minStake: 100,
    totalStaked: 3000000,
    tvl: 3000000
  }
];

// Simuler un délai réseau
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const stakingService = {
  // Récupérer tous les pools
  getPools: async (): Promise<StakingPool[]> => {
    await delay(500); // Simuler un délai réseau
    return pools;
  },

  // Récupérer un pool spécifique
  getPool: async (poolId: string): Promise<StakingPool | null> => {
    await delay(300);
    return pools.find(pool => pool.id === poolId) || null;
  },

  // Simuler une transaction de staking
  stake: async (
    poolId: string,
    amount: number,
    walletAddress: PublicKey
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    await delay(2000); // Simuler le temps de transaction

    const pool = pools.find(p => p.id === poolId);
    if (!pool) {
      return {
        success: false,
        error: 'Pool non trouvé'
      };
    }

    if (amount < pool.minStake) {
      return {
        success: false,
        error: `Montant minimum requis: ${pool.minStake} ${pool.token}`
      };
    }

    // Simuler une transaction réussie
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2)}`
    };
  },

  // Simuler une transaction de unstaking
  unstake: async (
    poolId: string,
    amount: number,
    walletAddress: PublicKey
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    await delay(2000);

    const pool = pools.find(p => p.id === poolId);
    if (!pool) {
      return {
        success: false,
        error: 'Pool non trouvé'
      };
    }

    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2)}`
    };
  },

  // Simuler la récupération des positions de staking
  getPositions: async (walletAddress: PublicKey): Promise<StakingPosition[]> => {
    await delay(800);
    return [
      {
        id: '1',
        poolId: 'sol-pool',
        amount: 10,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 jours
        rewards: 0.23
      },
      {
        id: '2',
        poolId: 'usdc-pool',
        amount: 1000,
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 jours
        rewards: 3.07
      }
    ];
  }
}; 