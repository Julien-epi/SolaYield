'use client';

import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/contexts/ToastContext';
import { YieldToken } from '@/services/marketplace';
import { marketplaceService } from '@/services/marketplace';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import LoadingOverlay from '@/components/UI/LoadingOverlay';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface OrderFormProps {
  token: YieldToken;
  type: 'buy' | 'sell';
  onClose: () => void;
}

const OrderForm: FC<OrderFormProps> = ({ token, type, onClose }) => {
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

    if (type === 'buy' && amountNum > token.availableSupply) {
      showToast('Erreur', 'Montant supérieur à l\'offre disponible', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const result = type === 'buy'
        ? await marketplaceService.createBuyOrder(token.id, amountNum, token.price, publicKey)
        : await marketplaceService.createSellOrder(token.id, amountNum, token.price, publicKey);

      if (result.success) {
        showToast('Succès', `Ordre de ${type === 'buy' ? 'achat' : 'vente'} créé avec succès`, 'success');
        onClose();
      } else {
        showToast('Erreur', result.error || 'Une erreur est survenue', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'ordre:', error);
      showToast('Erreur', 'Une erreur est survenue lors de la création de l\'ordre', 'error');
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
    <div className="modal p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {type === 'buy' ? 'Buy' : 'Sell'} {token.symbol}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter amount"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Unit Price</span>
            <span className="text-gray-900">${token.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Price</span>
            <span className="text-gray-900">
              ${(Number(amount) * token.price).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-2">Processing...</span>
              </div>
            ) : (
              `${type === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
            )}
          </button>
        </div>
      </form>

      {isProcessing && <LoadingOverlay isVisible={true} />}
    </div>
  );
};

export default OrderForm; 