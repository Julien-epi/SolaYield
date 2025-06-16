'use client';

import Link from 'next/link';
import WalletButton from '../Wallet/WalletButton';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              SolaYield
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/staking" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Staking
              </Link>
              <Link href="/marketplace" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Marketplace
              </Link>
              <Link href="/yield" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Yield
              </Link>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
            </div>
          </div>
          <WalletButton />
        </div>
      </nav>
    </header>
  );
};

export default Header; 