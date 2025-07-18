"use client";

import { FC, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Modal from "@/components/UI/Modal";
import YieldTokenCard from "@/components/Marketplace/YieldTokenCard";
import OrderForm from "@/components/Marketplace/OrderForm";
import { marketplaceService, YieldToken } from "@/services/marketplace";
import LoadingSpinner from "@/components/UI/LoadingSpinner";

const MarketplacePage: FC = () => {
  const { connected } = useWallet();
  const [tokens, setTokens] = useState<YieldToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<YieldToken | null>(null);
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const tokensData = await marketplaceService.getYieldTokens();
        setTokens(tokensData);
      } catch (error) {
        console.error("Erreur lors du chargement des tokens:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTokens();
  }, []);

  const handleBuy = (token: YieldToken) => {
    setSelectedToken(token);
    setOrderType("buy");
    setIsModalOpen(true);
  };

  const handleSell = (token: YieldToken) => {
    setSelectedToken(token);
    setOrderType("sell");
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  console.log("tokens", tokens);
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white-900">Marketplace</h1>
        <p className="mt-2 text-white-600">
          Achetez et vendez des tokens de yield sur le marché secondaire
        </p>
      </div>

      {!connected ? (
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600">
            Connectez votre wallet pour accéder à la marketplace
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tokens.map((token, index) => (
            <YieldTokenCard
              key={token.id + index}
              token={token}
              onBuy={handleBuy}
              onSell={handleSell}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={""}
        showCloseButton={false}
      >
        {selectedToken && (
          <OrderForm
            token={selectedToken}
            type={orderType}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default MarketplacePage;
