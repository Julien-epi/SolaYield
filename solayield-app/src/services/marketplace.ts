import { PublicKey, Connection } from '@solana/web3.js';
import { getAnchorProgram } from './anchor';
import * as anchor from '@coral-xyz/anchor';

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

// Helper pour convertir un Pubkey en symbole de token
function getTokenSymbol(tokenMint: string): string {
  if (tokenMint === 'So11111111111111111111111111111111111111112') return 'SOL';
  if (tokenMint === 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr') return 'USDC';
  return tokenMint.slice(0, 4) + '...' + tokenMint.slice(-4);
}

// Helper pour convertir un compte Marketplace Anchor en YieldToken front
function marketplaceAccountToYieldToken(account: any): YieldToken {
  return {
    id: account.marketplaceId ? account.marketplaceId.toString() : account.yield_token_mint?.toString() ?? '',
    name: `Yield Token ${getTokenSymbol(account.underlying_token_mint?.toString() ?? '')}`,
    symbol: getTokenSymbol(account.yield_token_mint?.toString() ?? ''),
    underlyingToken: getTokenSymbol(account.underlying_token_mint?.toString() ?? ''),
    apy: 0, // L'APY n'est pas dans Marketplace, il faut aller le chercher dans Strategy si besoin
    price: account.best_ask_price ? Number(account.best_ask_price) / 1_000_000 : 0,
    totalSupply: 0, // Non disponible ici
    availableSupply: 0, // Non disponible ici
    maturityDate: new Date(account.created_at ? Number(account.created_at) * 1000 : Date.now()),
    issuer: account.admin?.toString() ?? '',
  };
}

export const marketplaceService = {
  // Récupérer tous les tokens de yield depuis la blockchain
  getYieldTokens: async (): Promise<YieldToken[]> => {
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      // Wallet factice pour lecture seule
      const fakeWallet = {
        publicKey: new PublicKey('11111111111111111111111111111111'),
        signTransaction: async () => { throw new Error('Read-only wallet'); },
        signAllTransactions: async () => { throw new Error('Read-only wallet'); },
      };
      const program = getAnchorProgram(fakeWallet, connection);
      // Récupérer tous les comptes Marketplace
      const marketplaces = await (program.account as any).marketplace.all();
      // Mapper vers le format front
      return marketplaces.map((m: any) => marketplaceAccountToYieldToken(m.account));
    } catch (e) {
      console.error('Erreur lors du fetch des marketplaces:', e);
      return [];
    }
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