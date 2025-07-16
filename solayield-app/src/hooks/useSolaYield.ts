import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { stakingService, Strategy, UserPosition, StakingPool } from '../services/staking';
import { marketplaceService, YieldToken, Order, Marketplace } from '../services/marketplace';
import { solaYieldProgram } from '../services/program';

export const useSolaYield = () => {
  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  
  // État pour les données
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [yieldTokens, setYieldTokens] = useState<YieldToken[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [stakingPools, setStakingPools] = useState<StakingPool[]>([]);
  
  // État pour le loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialiser la connexion au programme
  const initializeProgram = useCallback(async () => {
    if (!connected || !publicKey || !wallet) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await solaYieldProgram.initializeProgram(wallet);
      setInitialized(true);
    } catch (err) {
      console.error('Error initializing program:', err);
      setError('Failed to initialize program');
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, wallet]);

  // Charger toutes les données
  const loadData = useCallback(async () => {
    if (!initialized || !connected || !publicKey) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger les données en parallèle
      const [
        strategiesData,
        marketplacesData,
        yieldTokensData,
        userPositionsData,
        userOrdersData,
        stakingPoolsData
      ] = await Promise.all([
        stakingService.getStrategies(),
        marketplaceService.getMarketplaces(),
        marketplaceService.getYieldTokens(),
        stakingService.getUserPositions(publicKey),
        marketplaceService.getUserOrders(publicKey),
        stakingService.getPools()
      ]);
      
      setStrategies(strategiesData);
      setMarketplaces(marketplacesData);
      setYieldTokens(yieldTokensData);
      setUserPositions(userPositionsData);
      setUserOrders(userOrdersData);
      setStakingPools(stakingPoolsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [initialized, connected, publicKey]);

  // Fonctions pour les stratégies

  const depositToStrategy = useCallback(async (strategyId: number, amount: number) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    try {
      setLoading(true);
      const tx = await stakingService.depositToStrategy(wallet, strategyId, amount);
      await loadData(); // Recharger les données
      return tx;
    } catch (err) {
      console.error('Error depositing to strategy:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, loadData]);

  const claimYield = useCallback(async (strategyId: number) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    try {
      setLoading(true);
      const tx = await stakingService.claimYield(wallet, strategyId);
      await loadData(); // Recharger les données
      return tx;
    } catch (err) {
      console.error('Error claiming yield:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, loadData]);

  const withdrawFromStrategy = useCallback(async (strategyId: number, amount: number) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    try {
      setLoading(true);
      const tx = await stakingService.withdrawFromStrategy(wallet, strategyId, amount);
      await loadData(); // Recharger les données
      return tx;
    } catch (err) {
      console.error('Error withdrawing from strategy:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, loadData]);

  // Fonctions pour les marketplaces

  const placeOrder = useCallback(async (
    marketplaceId: number,
    strategyId: number,
    orderType: 'buy' | 'sell',
    yieldTokenAmount: number,
    pricePerToken: number
  ) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    try {
      setLoading(true);
      const tx = await marketplaceService.placeOrder(wallet, marketplaceId, strategyId, orderType, yieldTokenAmount, pricePerToken);
      await loadData(); // Recharger les données
      return tx;
    } catch (err) {
      console.error('Error placing order:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, loadData]);

  const executeTrade = useCallback(async (
    orderId: number,
    tradeAmount: number,
    sellerPublicKey: PublicKey
  ) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    try {
      setLoading(true);
      const tx = await marketplaceService.executeTrade(wallet, orderId, tradeAmount, sellerPublicKey);
      await loadData(); // Recharger les données
      return tx;
    } catch (err) {
      console.error('Error executing trade:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, loadData]);

  const cancelOrder = useCallback(async (orderId: number) => {
    if (!wallet) throw new Error('Wallet not connected');
    
    try {
      setLoading(true);
      const tx = await marketplaceService.cancelOrder(wallet, orderId);
      await loadData(); // Recharger les données
      return tx;
    } catch (err) {
      console.error('Error canceling order:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, loadData]);

  // Initialiser et charger les données au montage
  useEffect(() => {
    if (connected && publicKey && !initialized) {
      initializeProgram();
    }
  }, [connected, publicKey, initialized, initializeProgram]);

  useEffect(() => {
    if (initialized) {
      loadData();
    }
  }, [initialized, loadData]);

  return {
    // État
    strategies,
    marketplaces,
    yieldTokens,
    userPositions,
    userOrders,
    stakingPools,
    loading,
    error,
    initialized,
    connected,
    publicKey,
    
    // Fonctions
    initializeProgram,
    loadData,
    
    // Fonctions stratégies
    depositToStrategy,
    claimYield,
    withdrawFromStrategy,
    
    // Fonctions marketplaces
    placeOrder,
    executeTrade,
    cancelOrder
  };
}; 