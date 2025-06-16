'use client';

import { FC } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  isVisible: boolean;
}

const LoadingOverlay: FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-100 text-center">Traitement en cours...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay; 