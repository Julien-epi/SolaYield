'use client';

import { FC } from 'react';
import { Position } from '@/services/dashboard';

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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
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
          <span className="text-gray-500">Yield gagné</span>
          <span className="font-medium">
            ${position.yieldEarned.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Date de début</span>
          <span className="font-medium">{formatDate(position.startDate)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Date d'échéance</span>
          <span className="font-medium">{formatDate(position.maturityDate)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Statut</span>
          <span
            className={`font-medium ${
              position.status === 'active' ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            {position.status === 'active' ? 'Actif' : 'Maturé'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PositionCard; 