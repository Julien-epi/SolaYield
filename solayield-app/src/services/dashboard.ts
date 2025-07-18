import { PublicKey, Connection } from '@solana/web3.js';
import { getAnchorProgram } from './anchor';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
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

const PROGRAM_ID = new PublicKey('BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');

// Helper function to get token symbol from mint address
function getTokenSymbol(mintAddress: string): string {
  // Wrapped SOL
  if (mintAddress === 'So11111111111111111111111111111111111111112') {
    return 'SOL';
  }
  // Common devnet USDC
  if (mintAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
    return 'USDC';
  }
  // For other tokens, just return first 6 characters
  return `${mintAddress.slice(0, 6)}...`;
}

// Helper function to calculate USD value (simplified)
function calculateUSDValue(amount: number, tokenSymbol: string): number {
  // Simplified pricing - in a real app, you'd use an oracle
  const prices: { [key: string]: number } = {
    'SOL': 100, // $100 per SOL
    'USDC': 1,  // $1 per USDC
  };
  
  return amount * (prices[tokenSymbol] || 1);
}

export const dashboardService = {
  // Récupérer les statistiques du dashboard
  getStats: async (walletAddress: PublicKey): Promise<DashboardStats> => {
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const fakeWallet = {
        publicKey: walletAddress,
        signTransaction: async () => { throw new Error('Read-only wallet'); },
        signAllTransactions: async () => { throw new Error('Read-only wallet'); },
      };
      
      const program = getAnchorProgram(fakeWallet, connection);
      
      // Get all user positions
      const userPositions = await (program.account as any).userPosition.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: walletAddress.toBase58(),
          },
        },
      ]);
      
      // Get all strategies for APY calculation
      const strategies = await (program.account as any).strategy.all();
      const strategiesMap = new Map();
      strategies.forEach((s: any) => {
        strategiesMap.set(s.publicKey.toString(), s.account);
      });
      
      let totalValueLocked = 0;
      let totalYieldEarned = 0;
      let activePositions = 0;
      let pendingRewards = 0;
      
      for (const position of userPositions) {
        const positionData = position.account;
        const strategy = strategiesMap.get(positionData.strategy.toString());
        
        if (strategy) {
          const tokenSymbol = getTokenSymbol(strategy.underlyingToken.toString());
          const amount = positionData.depositedAmount.toNumber() / 1e9; // Convert from lamports
          const value = calculateUSDValue(amount, tokenSymbol);
          
          totalValueLocked += value;
          totalYieldEarned += positionData.totalYieldClaimed.toNumber() / 1e9 * (tokenSymbol === 'SOL' ? 100 : 1);
          activePositions++;
          
          // Calculate pending rewards
          const currentTime = Math.floor(Date.now() / 1000);
          const timeElapsed = currentTime - positionData.lastYieldClaim.toNumber();
          const yieldAmount = strategy.apy.toNumber() * amount * timeElapsed / (365 * 24 * 60 * 60 * 10000);
          pendingRewards += calculateUSDValue(yieldAmount, tokenSymbol);
        }
      }
      
      return {
        totalValueLocked,
        totalYieldEarned,
        activePositions,
        pendingRewards,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return empty stats if error
      return {
        totalValueLocked: 0,
        totalYieldEarned: 0,
        activePositions: 0,
        pendingRewards: 0,
      };
    }
  },

  // Récupérer les positions actives
  getPositions: async (walletAddress: PublicKey): Promise<Position[]> => {
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const fakeWallet = {
        publicKey: walletAddress,
        signTransaction: async () => { throw new Error('Read-only wallet'); },
        signAllTransactions: async () => { throw new Error('Read-only wallet'); },
      };
      
      const program = getAnchorProgram(fakeWallet, connection);
      
      // Get all user positions
      const userPositions = await (program.account as any).userPosition.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: walletAddress.toBase58(),
          },
        },
      ]);
      
      // Get all strategies
      const strategies = await (program.account as any).strategy.all();
      const strategiesMap = new Map();
      strategies.forEach((s: any) => {
        strategiesMap.set(s.publicKey.toString(), s.account);
      });
      
      const positions: Position[] = [];
      
      for (const position of userPositions) {
        const positionData = position.account;
        const strategy = strategiesMap.get(positionData.strategy.toString());
        
        if (strategy) {
          const tokenSymbol = getTokenSymbol(strategy.underlyingToken.toString());
          const amount = positionData.depositedAmount.toNumber() / 1e9; // Convert from lamports
          const value = calculateUSDValue(amount, tokenSymbol);
          const apy = strategy.apy.toNumber() / 100; // Convert from basis points
          const yieldEarned = positionData.totalYieldClaimed.toNumber() / 1e9 * (tokenSymbol === 'SOL' ? 100 : 1);
          
          positions.push({
            id: position.publicKey.toString(),
            tokenSymbol,
            amount,
            value,
            apy,
            yieldEarned,
            startDate: new Date(positionData.depositTime.toNumber() * 1000),
            maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            status: 'active',
          });
        }
      }
      
      return positions;
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  },

  // Récupérer les tokens de yield détenus
  getYieldTokens: async (walletAddress: PublicKey): Promise<YieldToken[]> => {
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const fakeWallet = {
        publicKey: walletAddress,
        signTransaction: async () => { throw new Error('Read-only wallet'); },
        signAllTransactions: async () => { throw new Error('Read-only wallet'); },
      };
      
      const program = getAnchorProgram(fakeWallet, connection);
      
      // Get all strategies
      const strategies = await (program.account as any).strategy.all();
      const yieldTokens: YieldToken[] = [];
      
      for (const strategy of strategies) {
        const strategyData = strategy.account;
        const yieldTokenMint = new PublicKey(strategyData.yieldTokenMint);
        
        try {
          // Get user's associated token account for this yield token
          const userYieldTokenAccount = await getAssociatedTokenAddress(
            yieldTokenMint,
            walletAddress
          );
          
          // Check if account exists and get balance
          const accountInfo = await getAccount(connection, userYieldTokenAccount);
          const balance = Number(accountInfo.amount);
          
          if (balance > 0) {
            const tokenSymbol = getTokenSymbol(strategyData.underlyingToken.toString());
            const amount = balance / 1e9; // Convert from lamports
            const value = calculateUSDValue(amount, tokenSymbol);
            const apy = strategyData.apy.toNumber() / 100; // Convert from basis points
            
            yieldTokens.push({
              id: `yt-${strategyData.strategyId.toString()}`,
              symbol: `y${tokenSymbol}-${strategyData.strategyId.toString()}`,
              amount,
              value,
              apy,
              maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            });
          }
        } catch (error) {
          // Account doesn't exist or other error, skip this token
          continue;
        }
      }
      
      return yieldTokens;
    } catch (error) {
      console.error('Error fetching yield tokens:', error);
      return [];
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
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      
      // Get transaction signatures for the user
      const signatures = await connection.getSignaturesForAddress(walletAddress, {
        limit: limit * page,
      });
      
      const transactions = [];
      
      // Process recent transactions
      for (const sig of signatures.slice((page - 1) * limit, page * limit)) {
        try {
          const tx = await connection.getTransaction(sig.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
          });
          
          if (tx && tx.meta && !tx.meta.err) {
            // Try to determine transaction type based on program interactions
            const isOurProgram = tx.transaction.message.staticAccountKeys.some(
              (key: any) => key.toString() === PROGRAM_ID.toString()
            );
            
                         if (isOurProgram) {
               // This is a transaction with our program
               transactions.push({
                 id: sig.signature,
                 type: 'stake' as const, // Default to stake, could be improved with instruction parsing
                 amount: 0, // Would need to parse instruction data
                 token: 'SOL',
                 timestamp: new Date(sig.blockTime ? sig.blockTime * 1000 : Date.now()),
                 status: 'completed' as const,
               });
             }
          }
        } catch (error) {
          // Skip failed transactions
          continue;
        }
      }
      
      return {
        transactions,
        total: signatures.length,
      };
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return {
        transactions: [],
        total: 0,
      };
    }
  }
}; 