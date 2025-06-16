'use client';

import { FC } from 'react';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const WalletButton: FC = () => {
  return (
    <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700 !text-white transition-colors" />
  );
};

export default WalletButton; 