'use client';

import React, { useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getAnchorProgram } from '../../services/anchor';
import * as anchor from '@project-serum/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');
const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');

const CreateMarketplaceForm: React.FC = () => {
  const [strategyId, setStrategyId] = useState("");
  const [marketplaceId, setMarketplaceId] = useState("");
  const [tradingFeeBps, setTradingFeeBps] = useState("");
  const [loading, setLoading] = useState(false);

  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert("Connecte ton wallet !");
      return;
    }
    setLoading(true);
    try {
      const program = getAnchorProgram({ publicKey, signTransaction }, connection);
      const strategyIdBN = new anchor.BN(strategyId);
      const marketplaceIdBN = new anchor.BN(marketplaceId);
      const tradingFeeBpsNum = Number(tradingFeeBps);

      // PDA: strategy
      const [strategyPda] = await PublicKey.findProgramAddress(
        [Buffer.from("strategy"), strategyIdBN.toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID
      );
      // PDA: marketplace
      const [marketplacePda] = await PublicKey.findProgramAddress(
        [Buffer.from("marketplace"), strategyPda.toBuffer()],
        PROGRAM_ID
      );
      // PDA: marketplaceCounter
      const [marketplaceCounterPda] = await PublicKey.findProgramAddress(
        [Buffer.from("marketplace_counter")],
        PROGRAM_ID
      );

      // Récupérer la stratégie pour avoir les adresses yieldTokenMint et underlyingTokenMint
      const strategyAccount = await program.account.strategy.fetch(strategyPda);
      const yieldTokenMint = strategyAccount.yieldTokenMint;
      const underlyingTokenMint = strategyAccount.underlyingToken;

      await program.methods
        .createMarketplace(strategyIdBN, marketplaceIdBN, tradingFeeBpsNum)
        .accounts({
          admin: publicKey,
          strategy: strategyPda,
          marketplace: marketplacePda,
          marketplaceCounter: marketplaceCounterPda,
          yieldTokenMint,
          underlyingTokenMint,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      alert("Marketplace créé avec succès !");
      setStrategyId("");
      setMarketplaceId("");
      setTradingFeeBps("");
    } catch (err: any) {
      alert("Erreur lors de la création : " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#181c25] p-8 rounded-xl shadow-lg flex flex-col gap-6 w-full border border-[#23283a]">
      <label className="text-sm font-medium text-[#b0b8d1]">ID de la stratégie (u64)
        <input
          type="number"
          value={strategyId}
          onChange={e => setStrategyId(e.target.value)}
          className="mt-2 w-full bg-[#23283a] border border-[#3b4252] text-white placeholder-[#b0b8d1] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          required
          min={0}
          placeholder="Ex: 1"
        />
      </label>
      <label className="text-sm font-medium text-[#b0b8d1]">ID du marketplace (u64)
        <input
          type="number"
          value={marketplaceId}
          onChange={e => setMarketplaceId(e.target.value)}
          className="mt-2 w-full bg-[#23283a] border border-[#3b4252] text-white placeholder-[#b0b8d1] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          required
          min={0}
          placeholder="Ex: 1"
        />
      </label>
      <label className="text-sm font-medium text-[#b0b8d1]">Frais de trading (en basis points, max 1000)
        <input
          type="number"
          value={tradingFeeBps}
          onChange={e => setTradingFeeBps(e.target.value)}
          className="mt-2 w-full bg-[#23283a] border border-[#3b4252] text-white placeholder-[#b0b8d1] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          required
          min={0}
          max={1000}
          placeholder="Ex: 50 (pour 0.5%)"
        />
      </label>
      <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg transition text-lg mt-2 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400" disabled={loading}>
        {loading ? "Création en cours..." : "Créer le marketplace"}
      </button>
    </form>
  );
};

export default CreateMarketplaceForm; 