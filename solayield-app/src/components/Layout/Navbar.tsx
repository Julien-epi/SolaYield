'use client';

import { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletButton from '@/components/Wallet/WalletButton';

const Navbar: FC = () => {
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-gray-900 shadow-sm transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-extrabold text-indigo-400 tracking-wide">
              SolaYield
            </Link>
            <div className="hidden md:flex ml-14 space-x-10">
              <Link
                href="/staking"
                className={`${
                  isActive('/staking')
                    ? 'text-indigo-400'
                    : 'text-gray-300 hover:text-white'
                } px-5 py-3 text-lg font-semibold transition-colors rounded-md`}
              >
                Staking
              </Link>
              <Link
                href="/marketplace"
                className={`${
                  isActive('/marketplace')
                    ? 'text-indigo-400'
                    : 'text-gray-300 hover:text-white'
                } px-5 py-3 text-lg font-semibold transition-colors rounded-md`}
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
                  } px-5 py-3 text-lg font-semibold transition-colors rounded-md`}
                >
                  Dashboard
                </Link>
              )}
              {process.env.NEXT_PUBLIC_ADMIN_ADDRESS === publicKey?.toBase58() && (
              <Link
                href="/admin"
                className={`${
                  isActive('/admin')
                    ? 'text-indigo-400'
                    : 'text-gray-300 hover:text-white'
                } px-5 py-3 text-lg font-semibold transition-colors rounded-md`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-8">
            {/* <ThemeToggle /> */}
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 