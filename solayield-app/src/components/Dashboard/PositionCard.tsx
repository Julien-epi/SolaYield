'use client';

import { FC, useState } from 'react';
import { Position } from '@/services/dashboard';
import Modal from '@/components/UI/Modal';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';

interface PositionCardProps {
  position: Position;
}

const PositionCard: FC<PositionCardProps> = ({ position }) => {
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

  const handleRedeem = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.showToast('Succès', 'Rachat effectué avec succès !', 'success');
      setIsModalOpen(false);
    } catch (e) {
      toast.showToast('Erreur', "Le rachat a échoué.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg p-8 border-2 border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">
            {position.tokenSymbol}
          </h3>
          <p className="text-sm text-gray-500">
            {position.amount.toLocaleString()} {position.tokenSymbol}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-indigo-600">
            ${position.value.toLocaleString()}
          </p>
          <p className="text-sm text-green-600">APY: {position.apy}%</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Yield gagné</span>
          <span className="font-medium text-gray-100">
            ${position.yieldEarned.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Date de début</span>
          <span className="font-medium text-gray-100">{formatDate(position.startDate)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Date d'échéance</span>
          <span className="font-medium text-gray-100">{formatDate(position.maturityDate)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Statut</span>
          <span
            className={`font-medium ${position.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}
          >
            {position.status === 'active' ? 'Actif' : 'Maturé'}
          </span>
        </div>
        <>
          <button
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            onClick={() => setIsModalOpen(true)}
            disabled={isLoading}
          >
            Racheter (Redeem)
          </button>
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirmation" showCloseButton>
            <div className="space-y-6">
              <p>Êtes-vous sûr de vouloir racheter cette position ?</p>
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
                    className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
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
      </div>
    </div>
  );
};

export default PositionCard; 