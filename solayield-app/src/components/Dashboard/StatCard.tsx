'use client';

import { FC } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard: FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-gray-900 rounded-xl shadow-lg p-8 border-2 border-gray-700 flex flex-col justify-between h-full min-h-[170px]">
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-100">{value}</p>
      </div>
      <div className="flex items-center justify-center h-16 w-16 bg-indigo-900 rounded-full self-end">
        {icon}
      </div>
    </div>
  );
};

export default StatCard; 