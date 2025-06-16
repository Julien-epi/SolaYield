'use client';

import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LockClosedIcon, CurrencyDollarIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import StatCard from '@/components/Dashboard/StatCard';
import PositionCard from '@/components/Dashboard/PositionCard';
import { dashboardService } from '@/services/dashboard';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

const DashboardPage: FC = () => {
  const { publicKey, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [yieldTokens, setYieldTokens] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!publicKey) return;

      try {
        setIsLoading(true);
        const [statsData, positionsData, tokensData, transactionsData] = await Promise.all([
          dashboardService.getStats(publicKey),
          dashboardService.getPositions(publicKey),
          dashboardService.getYieldTokens(publicKey),
          dashboardService.getTransactionHistory(publicKey)
        ]);

        setStats(statsData);
        setPositions(positionsData);
        setYieldTokens(tokensData);
        setTransactions(transactionsData.transactions);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (connected) {
      loadDashboardData();
    }
  }, [publicKey, connected]);

  if (!connected) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-sm">
        <p className="text-gray-600">Connectez votre wallet pour accéder au dashboard</p>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Gérez vos positions et suivez vos performances
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Valeur Totale Lockée"
          value={`$${stats.totalValueLocked.toLocaleString()}`}
          icon={<LockClosedIcon className="h-6 w-6 text-indigo-600" />}
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatCard
          title="Yield Total Gagné"
          value={`$${stats.totalYieldEarned.toLocaleString()}`}
          icon={<CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />}
          trend={{ value: 3.8, isPositive: true }}
        />
        <StatCard
          title="Positions Actives"
          value={stats.activePositions}
          icon={<ChartBarIcon className="h-6 w-6 text-indigo-600" />}
        />
        <StatCard
          title="Récompenses en Attente"
          value={`$${stats.pendingRewards.toLocaleString()}`}
          icon={<ClockIcon className="h-6 w-6 text-indigo-600" />}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Positions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Historique des Transactions</h2>
        <div className="bg-gray-900 rounded-xl shadow-lg border-2 border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                    {tx.type === 'stake' ? 'Staking' : tx.type === 'unstake' ? 'Unstaking' : tx.type === 'buy' ? 'Achat' : 'Vente'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {tx.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {tx.token}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(tx.timestamp).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.status === 'completed'
                          ? 'bg-green-900 text-green-400'
                          : tx.status === 'pending'
                          ? 'bg-yellow-900 text-yellow-400'
                          : 'bg-red-900 text-red-400'
                      }`}
                    >
                      {tx.status === 'completed'
                        ? 'Complété'
                        : tx.status === 'pending'
                        ? 'En cours'
                        : 'Échoué'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 