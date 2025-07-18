"use client";

import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "@/contexts/ToastContext";
import { YieldToken } from "@/services/marketplace";
import { marketplaceService } from "@/services/marketplace";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import LoadingOverlay from "@/components/UI/LoadingOverlay";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface OrderFormProps {
  token: YieldToken;
  type: "buy" | "sell";
  onClose: () => void;
}

const OrderForm: FC<OrderFormProps> = ({ token, type, onClose }) => {
  const { publicKey, signTransaction, signAllTransactions, connected } =
    useWallet();
  const { showToast } = useToast();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Construction wallet Anchor-compatible
  const anchorWallet =
    publicKey && signTransaction && signAllTransactions
      ? { publicKey, signTransaction, signAllTransactions }
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !anchorWallet) {
      showToast(
        "Erreur",
        "Veuillez connecter votre wallet compatible Solana",
        "error"
      );
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Erreur", "Veuillez entrer un montant valide", "error");
      return;
    }

    if (type === "buy" && amountNum > token.availableSupply) {
      showToast("Erreur", "Montant supérieur à l'offre disponible", "error");
      return;
    }

    try {
      setIsProcessing(true);

      const result = await marketplaceService.placeOrderOnChain({
        type,
        tokenId: token.id,
        amount: amountNum,
        price: token.price,
        wallet: anchorWallet,
      });

      if (result.success) {
        showToast(
          "Succès",
          `Ordre de ${
            type === "buy" ? "achat" : "vente"
          } envoyé à la blockchain`,
          "success"
        );
        onClose();
      } else {
        showToast(
          "Erreur",
          result.error || "Erreur lors de la signature",
          "error"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'ordre:", error);
      showToast("Erreur", "Erreur lors de la création de l'ordre", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="modal p-8 rounded-lg shadow-2xl bg-gray-900 text-gray-100 max-w-xl mx-auto min-h-[380px] flex flex-col justify-center">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-100">
          {type === "buy" ? "Acheter" : "Vendre"} {token.symbol}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl focus:outline-none"
        >
          <XMarkIcon className="h-7 w-7" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 flex-1 flex flex-col justify-center"
      >
        <div>
          <label
            htmlFor="amount"
            className="block text-base font-medium text-gray-200 mb-2"
          >
            Montant
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg px-5 py-4"
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-base">
            <span className="text-gray-400">Prix unitaire</span>
            <span className="text-gray-100">${token.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-gray-400">Prix total</span>
            <span className="text-gray-100">
              ${(Number(amount) * token.price).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-indigo-700"
            disabled={isProcessing}
          >
            {isProcessing
              ? "Envoi en cours..."
              : type === "buy"
              ? "Acheter"
              : "Vendre"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-100 font-medium px-4 py-3 rounded-lg text-base"
            disabled={isProcessing}
          >
            Annuler
          </button>
        </div>
      </form>

      {isProcessing && <LoadingOverlay isVisible={true} />}
    </div>
  );
};

export default OrderForm;
