'use client';

import React, { useState } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getAnchorProgram } from '../../services/anchor';
import * as anchor from '@project-serum/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');

const CreateStrategyForm: React.FC = () => {
  const [name, setName] = useState("");
  const [apy, setApy] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [underlyingToken, setUnderlyingToken] = useState("");
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
      const apyBN = new anchor.BN(apy);
      const underlyingTokenKey = new PublicKey(underlyingToken);

      // PDA: strategy
      const [strategyPda] = await PublicKey.findProgramAddress(
        [Buffer.from("strategy"), strategyIdBN.toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID
      );
      // PDA: strategyCounter
      const [strategyCounterPda] = await PublicKey.findProgramAddress(
        [Buffer.from("strategy_counter")],
        PROGRAM_ID
      );
      // PDA: yieldTokenMint
      const [yieldTokenMintPda] = await PublicKey.findProgramAddress(
        [Buffer.from("yield_token"), strategyIdBN.toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID
      );

      await program.methods
        .createStrategy(name, apyBN, strategyIdBN)
        .accounts({
          admin: publicKey,
          strategy: strategyPda,
          strategyCounter: strategyCounterPda,
          underlyingToken: underlyingTokenKey,
          yieldTokenMint: yieldTokenMintPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      alert("Stratégie créée avec succès !");
      setName("");
      setApy("");
      setStrategyId("");
      setUnderlyingToken("");
    } catch (err: any) {
      alert("Erreur lors de la création : " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#181c25] p-8 rounded-xl shadow-lg flex flex-col gap-6 w-full border border-[#23283a]">
      <label className="text-sm font-medium text-[#b0b8d1]">Nom de la stratégie
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-2 w-full bg-[#23283a] border border-[#3b4252] text-white placeholder-[#b0b8d1] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          required
          maxLength={64}
          placeholder="Ex: USDC Yield"
        />
      </label>
      <label className="text-sm font-medium text-[#b0b8d1]">APY (en basis points, max 50000)
        <input
          type="number"
          value={apy}
          onChange={e => setApy(e.target.value)}
          className="mt-2 w-full bg-[#23283a] border border-[#3b4252] text-white placeholder-[#b0b8d1] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          required
          min={0}
          max={50000}
          placeholder="Ex: 500 (pour 5%)"
        />
      </label>
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
      <label className="text-sm font-medium text-[#b0b8d1]">Mint SPL sous-jacent
        <input
          type="text"
          value={underlyingToken}
          onChange={e => setUnderlyingToken(e.target.value)}
          className="mt-2 w-full bg-[#23283a] border border-[#3b4252] text-white placeholder-[#b0b8d1] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          required
          placeholder="Adresse du mint SPL (ex USDC: Ejmc1UB4EsES5UfZyiGzW2FQWRFJ6T5oLrFHC8FwhDsQ)"
        />
      </label>
      <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg transition text-lg mt-2 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400" disabled={loading}>
        {loading ? "Création en cours..." : "Créer la stratégie"}
      </button>
    </form>
  );
};

export default CreateStrategyForm; 