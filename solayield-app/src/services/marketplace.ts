import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { solaYieldProgram, SolaYieldProgram } from './program';

export interface YieldToken {
  id: string;
  name: string;
  symbol: string;
  underlyingToken: string;
  apy: number;
  price: number;
  totalSupply: number;
  availableSupply: number;
  strategyAddress: PublicKey;
  yieldTokenMint: PublicKey;
  underlyingTokenMint: PublicKey;
  maturityDate: Date;
  issuer: string;
}

export interface Order {
  id: string;
  user: PublicKey;
  marketplace: PublicKey;
  type: 'buy' | 'sell';
  yieldTokenAmount: number;
  pricePerToken: number;
  totalValue: number;
  filledAmount: number;
  isActive: boolean;
  createdAt: Date;
  orderId: number;
}

export interface Marketplace {
  id: string;
  strategy: PublicKey;
  yieldTokenMint: PublicKey;
  underlyingTokenMint: PublicKey;
  totalVolume: number;
  totalTrades: number;
  bestBidPrice: number;
  bestAskPrice: number;
  tradingFeeBps: number;
  isActive: boolean;
  createdAt: Date;
  marketplaceId: number;
}

export const marketplaceService = {
  // Récupérer tous les marketplaces
  getMarketplaces: async (): Promise<Marketplace[]> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Récupérer tous les comptes Marketplace
      const marketplaces = await program.account.marketplace.all();
      
      return marketplaces.map((marketplace: any) => ({
        id: marketplace.account.marketplaceId.toString(),
        strategy: marketplace.account.strategy,
        yieldTokenMint: marketplace.account.yieldTokenMint,
        underlyingTokenMint: marketplace.account.underlyingTokenMint,
        totalVolume: Number(marketplace.account.totalVolume) / 1e9,
        totalTrades: Number(marketplace.account.totalTrades),
        bestBidPrice: Number(marketplace.account.bestBidPrice) / 1e6, // Prix avec 6 décimales
        bestAskPrice: Number(marketplace.account.bestAskPrice) / 1e6,
        tradingFeeBps: marketplace.account.tradingFeeBps,
        isActive: marketplace.account.isActive,
        createdAt: new Date(Number(marketplace.account.createdAt) * 1000),
        marketplaceId: Number(marketplace.account.marketplaceId)
      }));
    } catch (error) {
      console.warn('Program not initialized or no marketplaces found:', error);
      return [];
    }
  },

  // Récupérer les ordres d'un marketplace
  getOrders: async (marketplaceId: number): Promise<Order[]> => {
    try {
      const program = solaYieldProgram.getProgram();
      // Pour récupérer les ordres, nous avons besoin d'abord de récupérer l'adresse de la stratégie
      // Cette fonction pourrait nécessiter une refactorisation pour fonctionner correctement
      const [marketplacePDA] = SolaYieldProgram.findMarketplacePDA(new PublicKey("11111111111111111111111111111111"));
      
      // Récupérer tous les ordres pour ce marketplace
      const orders = await program.account.tradeOrder.all([
        {
          memcmp: {
            offset: 8 + 32, // Discriminator + user
            bytes: marketplacePDA.toBase58()
          }
        }
      ]);

      return orders.map((order: any) => ({
        id: order.account.orderId.toString(),
        user: order.account.user,
        marketplace: order.account.marketplace,
        type: order.account.orderType === 0 ? 'buy' : 'sell',
        yieldTokenAmount: Number(order.account.yieldTokenAmount) / 1e9,
        pricePerToken: Number(order.account.pricePerToken) / 1e6,
        totalValue: Number(order.account.totalValue) / 1e9,
        filledAmount: Number(order.account.filledAmount) / 1e9,
        isActive: order.account.isActive,
        createdAt: new Date(Number(order.account.createdAt) * 1000),
        orderId: Number(order.account.orderId)
      }));
    } catch (error) {
      console.warn('Program not initialized or no orders found:', error);
      return [];
    }
  },

  // Placer un ordre
  placeOrder: async (
    wallet: any,
    marketplaceId: number,
    strategyId: number,
    orderType: 'buy' | 'sell',
    yieldTokenAmount: number,
    pricePerToken: number
  ): Promise<string> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Générer un ID d'ordre unique
      const orderId = Date.now();
      
      // Trouver les PDAs
      // TODO: Récupérer d'abord l'adresse de la stratégie pour calculer le marketplace PDA
      const [marketplacePDA] = SolaYieldProgram.findMarketplacePDA(new PublicKey("11111111111111111111111111111111"));
      const [orderPDA] = SolaYieldProgram.findOrderPDA(wallet.publicKey, orderId);
      const [orderCounterPDA] = SolaYieldProgram.findOrderCounterPDA();
      const [yieldTokenMintPDA] = SolaYieldProgram.findYieldTokenMintPDA(strategyId);
      
      // Récupérer les infos du marketplace
      const marketplace = await program.account.marketplace.fetch(marketplacePDA);
      
      // Créer le compte escrow pour l'ordre
      const escrowPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), orderPDA.toBuffer()],
        solaYieldProgram.getProgramId()
      )[0];
      
      // Déterminer quel token est utilisé pour l'escrow
      const tokenMint = orderType === 'buy' ? marketplace.underlyingTokenMint : marketplace.yieldTokenMint;
      const userTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);

      // Convertir les montants
      const yieldTokenAmountLamports = new anchor.BN(yieldTokenAmount * 1e9);
      const pricePerTokenLamports = new anchor.BN(pricePerToken * 1e6); // Prix avec 6 décimales
      const orderTypeValue = orderType === 'buy' ? 0 : 1;

      const tx = await (program.methods as any)
        .placeOrder(
          new anchor.BN(orderId),
          orderTypeValue,
          yieldTokenAmountLamports,
          pricePerTokenLamports
        )
        .accounts({
          user: wallet.publicKey,
          marketplace: marketplacePDA,
          order: orderPDA,
          orderCounter: orderCounterPDA,
          yieldTokenMint: yieldTokenMintPDA,
          underlyingTokenMint: marketplace.underlyingTokenMint,
          escrowAccount: escrowPDA,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  },

  // Exécuter un trade
  executeTrade: async (
    wallet: any,
    orderId: number,
    tradeAmount: number,
    sellerPublicKey: PublicKey
  ): Promise<string> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Trouver les PDAs
      const [orderPDA] = SolaYieldProgram.findOrderPDA(sellerPublicKey, orderId);
      
      // Récupérer les infos de l'ordre
      const order = await program.account.tradeOrder.fetch(orderPDA);
      const marketplace = await program.account.marketplace.fetch(order.marketplace);
      
      const escrowPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), orderPDA.toBuffer()],
        solaYieldProgram.getProgramId()
      )[0];

      // Comptes de tokens pour l'acheteur
      const buyerYieldAccount = await getAssociatedTokenAddress(
        marketplace.yieldTokenMint,
        wallet.publicKey
      );
      const buyerUnderlyingAccount = await getAssociatedTokenAddress(
        marketplace.underlyingTokenMint,
        wallet.publicKey
      );

      // Comptes de tokens pour le vendeur
      const sellerUnderlyingAccount = await getAssociatedTokenAddress(
        marketplace.underlyingTokenMint,
        sellerPublicKey
      );

      const tradeAmountLamports = new anchor.BN(tradeAmount * 1e9);

      const tx = await (program.methods as any)
        .executeTrade(tradeAmountLamports)
        .accounts({
          buyer: wallet.publicKey,
          seller: sellerPublicKey,
          marketplace: order.marketplace,
          order: orderPDA,
          yieldTokenMint: marketplace.yieldTokenMint,
          underlyingTokenMint: marketplace.underlyingTokenMint,
          escrowAccount: escrowPDA,
          buyerYieldAccount,
          buyerUnderlyingAccount,
          sellerUnderlyingAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error executing trade:', error);
      throw error;
    }
  },

  // Annuler un ordre
  cancelOrder: async (
    wallet: any,
    orderId: number
  ): Promise<string> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Trouver les PDAs
      const [orderPDA] = SolaYieldProgram.findOrderPDA(wallet.publicKey, orderId);
      
      // Récupérer les infos de l'ordre
      const order = await program.account.tradeOrder.fetch(orderPDA);
      const marketplace = await program.account.marketplace.fetch(order.marketplace);
      
      const escrowPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), orderPDA.toBuffer()],
        solaYieldProgram.getProgramId()
      )[0];

      // Déterminer le token à retourner
      const tokenMint = order.orderType === 0 ? marketplace.underlyingTokenMint : marketplace.yieldTokenMint;
      const userTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);

      const tx = await (program.methods as any)
        .cancelOrder(new anchor.BN(orderId))
        .accounts({
          user: wallet.publicKey,
          marketplace: order.marketplace,
          order: orderPDA,
          escrowAccount: escrowPDA,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  },

  // Récupérer les ordres d'un utilisateur
  getUserOrders: async (userPublicKey: PublicKey): Promise<Order[]> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Récupérer tous les ordres de l'utilisateur
      const orders = await program.account.tradeOrder.all([
        {
          memcmp: {
            offset: 8, // Discriminator
            bytes: userPublicKey.toBase58()
          }
        }
      ]);

      return orders.map((order: any) => ({
        id: order.account.orderId.toString(),
        user: order.account.user,
        marketplace: order.account.marketplace,
        type: order.account.orderType === 0 ? 'buy' : 'sell',
        yieldTokenAmount: Number(order.account.yieldTokenAmount) / 1e9,
        pricePerToken: Number(order.account.pricePerToken) / 1e6,
        totalValue: Number(order.account.totalValue) / 1e9,
        filledAmount: Number(order.account.filledAmount) / 1e9,
        isActive: order.account.isActive,
        createdAt: new Date(Number(order.account.createdAt) * 1000),
        orderId: Number(order.account.orderId)
      }));
    } catch (error) {
      console.warn('Program not initialized or no user orders found:', error);
      return [];
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

  // Récupérer les tokens de yield disponibles sur la marketplace
  getYieldTokens: async (): Promise<YieldToken[]> => {
    try {
      const program = solaYieldProgram.getProgram();
      
      // Récupérer tous les marketplaces
      const marketplaces = await program.account.marketplace.all();
      
      // Pour chaque marketplace, récupérer les infos de la stratégie correspondante
      const yieldTokens: YieldToken[] = [];
      
      for (const marketplace of marketplaces) {
        try {
          const strategy = await program.account.strategy.fetch(marketplace.account.strategy);
          
          const yieldToken: YieldToken = {
            id: marketplace.account.marketplaceId.toString(),
            name: strategy.name + " Yield Token",
            symbol: "Y" + strategy.name.substring(0, 3).toUpperCase(),
            underlyingToken: strategy.name,
            apy: Number(strategy.apy) / 100,
            price: Number(marketplace.account.bestAskPrice) / 1e6 || 1.0,
            totalSupply: Number(strategy.totalYieldTokensMinted) / 1e9,
            availableSupply: Number(strategy.totalYieldTokensMinted) / 1e9,
            strategyAddress: marketplace.account.strategy,
            yieldTokenMint: strategy.yieldTokenMint,
            underlyingTokenMint: strategy.underlyingToken,
            maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an à partir de maintenant
            issuer: "SolaYield Protocol"
          };
          
          yieldTokens.push(yieldToken);
        } catch (error) {
          console.warn('Could not fetch strategy for marketplace:', marketplace.account.marketplaceId, error);
        }
      }
      
      return yieldTokens;
    } catch (error) {
      console.warn('Program not initialized or no yield tokens found, returning demo data:', error);
      // Retourner des données de démonstration
      return [
        {
          id: '1',
          name: 'SOL Yield Token',
          symbol: 'ySOL',
          underlyingToken: 'SOL',
          apy: 8.5,
          price: 1.02,
          totalSupply: 10000,
          availableSupply: 7500,
          strategyAddress: new PublicKey('11111111111111111111111111111111'),
          yieldTokenMint: new PublicKey('11111111111111111111111111111111'),
          underlyingTokenMint: new PublicKey('11111111111111111111111111111111'),
          maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          issuer: "SolaYield Protocol"
        },
        {
          id: '2', 
          name: 'USDC Yield Token',
          symbol: 'yUSDC',
          underlyingToken: 'USDC',
          apy: 12.3,
          price: 1.05,
          totalSupply: 50000,
          availableSupply: 32000,
          strategyAddress: new PublicKey('11111111111111111111111111111111'),
          yieldTokenMint: new PublicKey('11111111111111111111111111111111'),
          underlyingTokenMint: new PublicKey('11111111111111111111111111111111'),
          maturityDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          issuer: "SolaYield Protocol"
        }
      ];
    }
  },


}; 