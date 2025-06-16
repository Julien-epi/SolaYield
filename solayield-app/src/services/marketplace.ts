import { PublicKey } from '@solana/web3.js';

export interface YieldToken {
  id: string;
  name: string;
  symbol: string;
  underlyingToken: string;
  apy: number;
  price: number;
  totalSupply: number;
  availableSupply: number;
  maturityDate: Date;
  issuer: string;
}

export interface Order {
  id: string;
  tokenId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  seller: string;
  status: 'open' | 'filled' | 'cancelled';
  createdAt: Date;
}

// Simulation de données
const yieldTokens: YieldToken[] = [
  {
    id: 'yt-sol-1',
    name: 'SOL Yield Token 2024',
    symbol: 'ySOL-2024',
    underlyingToken: 'SOL',
    apy: 12,
    price: 1.05,
    totalSupply: 1000000,
    availableSupply: 500000,
    maturityDate: new Date('2024-12-31'),
    issuer: 'SolaYield Protocol'
  },
  {
    id: 'yt-usdc-1',
    name: 'USDC Yield Token 2024',
    symbol: 'yUSDC-2024',
    underlyingToken: 'USDC',
    apy: 8,
    price: 1.02,
    totalSupply: 2000000,
    availableSupply: 1000000,
    maturityDate: new Date('2024-12-31'),
    issuer: 'SolaYield Protocol'
  }
];

const orders: Order[] = [
  {
    id: '1',
    tokenId: 'yt-sol-1',
    type: 'sell',
    amount: 100,
    price: 1.05,
    total: 105,
    seller: '0x123...',
    status: 'open',
    createdAt: new Date()
  },
  {
    id: '2',
    tokenId: 'yt-usdc-1',
    type: 'buy',
    amount: 500,
    price: 1.02,
    total: 510,
    seller: '0x456...',
    status: 'open',
    createdAt: new Date()
  }
];

// Simuler un délai réseau
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const marketplaceService = {
  // Récupérer tous les tokens de yield
  getYieldTokens: async (): Promise<YieldToken[]> => {
    await delay(500);
    return yieldTokens;
  },

  // Récupérer un token spécifique
  getYieldToken: async (tokenId: string): Promise<YieldToken | null> => {
    await delay(300);
    return yieldTokens.find(token => token.id === tokenId) || null;
  },

  // Récupérer les ordres ouverts
  getOpenOrders: async (): Promise<Order[]> => {
    await delay(400);
    return orders.filter(order => order.status === 'open');
  },

  // Créer un ordre d'achat
  createBuyOrder: async (
    tokenId: string,
    amount: number,
    price: number,
    walletAddress: PublicKey
  ): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    await delay(1000);

    const token = yieldTokens.find(t => t.id === tokenId);
    if (!token) {
      return {
        success: false,
        error: 'Token non trouvé'
      };
    }

    if (amount > token.availableSupply) {
      return {
        success: false,
        error: 'Montant supérieur à l\'offre disponible'
      };
    }

    const order: Order = {
      id: Math.random().toString(36).substring(7),
      tokenId,
      type: 'buy',
      amount,
      price,
      total: amount * price,
      seller: walletAddress.toString(),
      status: 'open',
      createdAt: new Date()
    };

    orders.push(order);
    return {
      success: true,
      orderId: order.id
    };
  },

  // Créer un ordre de vente
  createSellOrder: async (
    tokenId: string,
    amount: number,
    price: number,
    walletAddress: PublicKey
  ): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    await delay(1000);

    const token = yieldTokens.find(t => t.id === tokenId);
    if (!token) {
      return {
        success: false,
        error: 'Token non trouvé'
      };
    }

    const order: Order = {
      id: Math.random().toString(36).substring(7),
      tokenId,
      type: 'sell',
      amount,
      price,
      total: amount * price,
      seller: walletAddress.toString(),
      status: 'open',
      createdAt: new Date()
    };

    orders.push(order);
    return {
      success: true,
      orderId: order.id
    };
  },

  // Exécuter un ordre
  executeOrder: async (
    orderId: string,
    walletAddress: PublicKey
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    await delay(2000);

    const order = orders.find(o => o.id === orderId);
    if (!order) {
      return {
        success: false,
        error: 'Ordre non trouvé'
      };
    }

    if (order.status !== 'open') {
      return {
        success: false,
        error: 'L\'ordre n\'est plus disponible'
      };
    }

    order.status = 'filled';
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2)}`
    };
  }
}; 