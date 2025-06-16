'use client';

import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/contexts/ToastContext';
import { StakingPool } from '@/services/staking';
import { stakingService } from '@/services/staking';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import LoadingOverlay from '@/components/UI/LoadingOverlay';

interface StakeFormProps {
  pool: StakingPool;
  onClose: () => void;
}

const StakeForm: FC<StakeFormProps> = ({ pool, onClose }) => {
  const { publicKey } = useWallet();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      showToast('Erreur', 'Veuillez connecter votre wallet', 'error');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Erreur', 'Veuillez entrer un montant valide', 'error');
      return;
    }

    if (amountNum < pool.minStake) {
      showToast('Erreur', `Le montant minimum est de ${pool.minStake} ${pool.token}`, 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await stakingService.stake(pool.id, amountNum, publicKey);

      if (result.success) {
        showToast('Succès', 'Staking effectué avec succès', 'success');
        onClose();
      } else {
        showToast('Erreur', result.error || 'Une erreur est survenue', 'error');
      }
    } catch (error) {
      console.error('Erreur lors du staking:', error);
      showToast('Erreur', 'Une erreur est survenue lors du staking', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Montant à staker
        </label>
        <div className="mt-1">
          <input
            type="number"
            name="amount"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
            step="0.01"
            min={pool.minStake}
            required
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Montant minimum: {pool.minStake} {pool.token}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          APY: {pool.apy}%
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Staker
        </button>
      </div>

      <LoadingOverlay isVisible={isProcessing} />
    </form>
  );
};

export default StakeForm; 