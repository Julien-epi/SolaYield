'use client';

import { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletButton from '@/components/Wallet/WalletButton';

const Navbar: FC = () => {
  const pathname = usePathname();
  const { connected } = useWallet();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-gray-900 shadow-sm transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-400">
              SolaYield
            </Link>
            <div className="hidden md:flex ml-10 space-x-8">
              <Link
                href="/staking"
                className={`${
                  isActive('/staking')
                    ? 'text-indigo-400'
                    : 'text-gray-300 hover:text-white'
                } px-3 py-2 text-sm font-medium transition-colors`}
              >
                Staking
              </Link>
              <Link
                href="/marketplace"
                className={`${
                  isActive('/marketplace')
                    ? 'text-indigo-400'
                    : 'text-gray-300 hover:text-white'
                } px-3 py-2 text-sm font-medium transition-colors`}
              >
                Marketplace
              </Link>
              {connected && (
                <Link
                  href="/dashboard"
                  className={`${
                    isActive('/dashboard')
                      ? 'text-indigo-400'
                      : 'text-gray-300 hover:text-white'
                  } px-3 py-2 text-sm font-medium transition-colors`}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* <ThemeToggle /> */}
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 