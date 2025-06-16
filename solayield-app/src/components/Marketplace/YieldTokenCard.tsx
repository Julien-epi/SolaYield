'use client';

import { FC } from 'react';
import { YieldToken } from '@/services/marketplace';

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
      </div>
    </div>
  );
};

export default YieldTokenCard; 