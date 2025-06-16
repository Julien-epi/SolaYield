'use client';

import { FC } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: FC<StatCardProps> = ({ title, value, icon, trend }) => {
  return (
    <div className="bg-gray-900 rounded-xl shadow-lg p-8 border-2 border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-100">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center">
              <span
                className={`text-sm font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}
              >
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-sm text-gray-400">vs mois dernier</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-indigo-900 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard; 