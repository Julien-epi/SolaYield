'use client';

import { FC, useState } from 'react';
import { YieldToken } from '@/services/marketplace';
import Modal from '@/components/UI/Modal';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';

interface YieldTokenCardProps {
  token: YieldToken;
  onBuy: (token: YieldToken) => void;
  onSell: (token: YieldToken) => void;
}

const YieldTokenCard: FC<YieldTokenCardProps> = ({ token, onBuy, onSell }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const isMatured = new Date(token.maturityDate) <= new Date();

  const handleRedeem = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // simulation
      toast.showToast('Succès', 'Rachat effectué avec succès !', 'success');
      setIsModalOpen(false);
    } catch (e) {
      toast.showToast('Erreur', "Le rachat a échoué.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card rounded-xl shadow-lg p-8 bg-gray-900 border-2 border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-100">{token.name}</h3>
          <p className="text-sm text-gray-400">{token.symbol}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-100">${token.price.toFixed(2)}</p>
          <p className="text-sm text-indigo-400">{token.apy}% APY</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-400">Total Supply</span>
          <span className="text-gray-100">{token.totalSupply.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Available Supply</span>
          <span className="text-gray-100">{token.availableSupply.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Maturity Date</span>
          <span className="text-gray-100">{formatDate(token.maturityDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Issuer</span>
          <span className="text-gray-100">{token.issuer}</span>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => onBuy(token)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Buy
        </button>
        <button
          onClick={() => onSell(token)}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Sell
        </button>
        {isMatured && (
          <>
            <button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              onClick={() => setIsModalOpen(true)}
              disabled={isLoading}
            >
              Racheter (Redeem)
            </button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirmation" showCloseButton>
              <div className="space-y-6">
                <p>Êtes-vous sûr de vouloir racheter ce Yield Token ?</p>
                {isLoading ? (
                  <LoadingSpinner size="md" color="primary" />
                ) : (
                  <div className="flex justify-end gap-4">
                    <button
                      className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isLoading}
                    >
                      Annuler
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                      onClick={handleRedeem}
                      disabled={isLoading}
                    >
                      Confirmer
                    </button>
                  </div>
                )}
              </div>
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};

export default YieldTokenCard; 