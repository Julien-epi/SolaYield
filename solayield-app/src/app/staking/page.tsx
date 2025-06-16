'use client';

import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Modal from '@/components/UI/Modal';
import StakeForm from '@/components/Staking/StakeForm';
import { stakingService, StakingPool } from '@/services/staking';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

const StakingPage: FC = () => {
  const { connected, publicKey } = useWallet();
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPools = async () => {
      try {
        const poolsData = await stakingService.getPools();
        setPools(poolsData);
      } catch (error) {
        console.error('Erreur lors du chargement des pools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPools();
  }, []);

  const handleStakeClick = (pool: StakingPool) => {
    setSelectedPool(pool);
    setIsStakeModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-100">Staking & Lending</h1>
        <p className="mt-2 text-gray-400">
          Déposez vos actifs et commencez à générer des rendements
        </p>
      </div>

      {!connected ? (
        <div className="text-center p-8 bg-gray-900 rounded-lg shadow-sm">
          <p className="text-gray-400">Connectez votre wallet pour commencer le staking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pools.map((pool) => (
            <div key={pool.id} className="bg-gray-900 p-8 rounded-xl shadow-lg border-2 border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-100 mb-6">{pool.name}</h2>
              <div className="space-y-6">
                <div className="flex justify-between text-base">
                  <span className="text-gray-400">APY</span>
                  <span className="font-medium text-gray-100">{pool.apy}%</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-gray-400">Total Value Locked</span>
                  <span className="font-medium text-gray-100">${pool.tvl.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-gray-400">Minimum Stake</span>
                  <span className="font-medium text-gray-100">{pool.minStake} {pool.token}</span>
                </div>
                <button 
                  onClick={() => handleStakeClick(pool)}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md text-base font-semibold hover:bg-indigo-700"
                >
                  Stake {pool.token}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isStakeModalOpen}
        onClose={() => setIsStakeModalOpen(false)}
        title={selectedPool?.name || ''}
      >
        {selectedPool && (
          <StakeForm
            pool={selectedPool}
            onClose={() => setIsStakeModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default StakingPage; 