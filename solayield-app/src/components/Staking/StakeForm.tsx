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
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWrapping, setIsWrapping] = useState(false);



  const handleWrapSol = async () => {
    if (!publicKey) {
      showToast('Erreur', 'Veuillez connecter votre wallet', 'error');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Erreur', 'Veuillez entrer un montant valide', 'error');
      return;
    }

    try {
      setIsWrapping(true);
      const result = await stakingService.wrapSol(amountNum, wallet);

      if (result.success) {
        showToast('Succès', 'SOL wrappé avec succès! Vous pouvez maintenant staker.', 'success');
      } else {
        showToast('Erreur', result.error || 'Une erreur est survenue lors du wrapping', 'error');
      }
    } catch (error) {
      showToast('Erreur', 'Une erreur est survenue lors du wrapping', 'error');
    } finally {
      setIsWrapping(false);
    }
  };

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
      const result = await stakingService.stake(pool.id, amountNum, wallet);

      if (result.success) {
        showToast('Succès', 'Staking effectué avec succès', 'success');
        onClose();
      } else {
        showToast('Erreur', result.error || 'Une erreur est survenue', 'error');
      }
    } catch (error) {
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
    <form onSubmit={handleSubmit} className="space-y-8 min-h-[320px] flex flex-col justify-center">
      <div>
        <label htmlFor="amount" className="block text-base font-medium text-gray-200 mb-2">
          Montant à staker
        </label>
        <div className="mt-1">
          <input
            type="number"
            name="amount"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg px-5 py-4"
            placeholder="0.00"
            step="0.001"
            min={pool.minStake}
            required
          />
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Montant minimum: {pool.minStake} {pool.token}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          APY: {pool.apy}%
        </p>
      </div>

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
        <p className="text-sm text-blue-200">
          💡 <strong>Étapes pour staker :</strong>
        </p>
        <ol className="text-sm text-blue-300 mt-1 ml-4 list-decimal">
          <li>Wrapper vos SOL (conversion en wrapped SOL)</li>
          <li>Staker vos wrapped SOL dans la stratégie</li>
        </ol>
      </div>

      <div className="space-y-3 mt-4">
        <button
          type="button"
          onClick={handleWrapSol}
          disabled={isWrapping || isProcessing}
          className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isWrapping ? 'Wrapping SOL...' : '1. Wrapper SOL d\'abord'}
        </button>
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-800 text-gray-100 border border-gray-700 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isProcessing || isWrapping}
            className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Staking...' : '2. Staker'}
          </button>
        </div>
      </div>

      <LoadingOverlay isVisible={isProcessing} />
    </form>
  );
};

export default StakeForm; 