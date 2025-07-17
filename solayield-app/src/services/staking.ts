import { PublicKey, Connection, Transaction } from "@solana/web3.js";
import { getAnchorProgram } from "./anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";

export interface StakingPool {
  id: string;
  name: string;
  token: string;
  apy: number;
  minStake: number;
  totalStaked: number;
  tvl: number;
  strategyId: number;
  admin: string;
  underlyingToken: string;
  yieldTokenMint: string;
}

export interface StakingPosition {
  id: string;
  poolId: string;
  amount: number;
  startDate: Date;
  rewards: number;
}

const PROGRAM_ID = new PublicKey(
  "BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az"
);

// Fonction pour récupérer toutes les stratégies depuis la blockchain
async function fetchStrategiesFromBlockchain(
  connection: Connection
): Promise<StakingPool[]> {
  try {
    // Créer un programme Anchor avec un wallet factice pour les lectures seules
    const fakeWallet = {
      publicKey: new PublicKey("11111111111111111111111111111111"),
      signTransaction: async () => {
        throw new Error("Read-only wallet");
      },
      signAllTransactions: async () => {
        throw new Error("Read-only wallet");
      },
    };

    const program = getAnchorProgram(fakeWallet, connection);

    // Récupérer tous les comptes Strategy
    const strategies = await (program.account as any).strategy.all();

    return strategies.map((strategy: any, index: number) => {
      const data = strategy.account;

      return {
        id: `strategy-${data.strategyId.toString()}`,
        name: data.name || `Strategy ${data.strategyId.toString()}`,
        token: getTokenSymbol(data.underlyingToken.toString()),
        apy: data.apy ? data.apy.toNumber() / 100 : 0, // Convertir basis points en %
        minStake: 0.001, // Minimum pratique (smart contract: > 0)
        totalStaked: data.totalDeposits ? data.totalDeposits.toNumber() : 0,
        tvl: data.totalDeposits ? data.totalDeposits.toNumber() : 0,
        strategyId: data.strategyId.toNumber(),
        admin: data.admin.toString(),
        underlyingToken: data.underlyingToken.toString(),
        yieldTokenMint: data.yieldTokenMint.toString(),
      };
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stratégies:", error);
    return [];
  }
}

// Fonction helper pour obtenir le symbole du token
function getTokenSymbol(tokenMint: string): string {
  // SOL wrapped
  if (tokenMint === "So11111111111111111111111111111111111111112") {
    return "SOL";
  }
  // USDC (vous pouvez ajouter d'autres tokens)
  if (tokenMint === "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr") {
    return "USDC";
  }
  // Par défaut, afficher une version courte de l'adresse
  return `${tokenMint.slice(0, 4)}...${tokenMint.slice(-4)}`;
}

// Simuler un délai réseau
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const stakingService = {
  // Récupérer tous les pools (maintenant depuis la blockchain !)
  getPools: async (): Promise<StakingPool[]> => {
    await delay(500);
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
    return await fetchStrategiesFromBlockchain(connection);
  },

  // Récupérer un pool spécifique
  getPool: async (poolId: string): Promise<StakingPool | null> => {
    await delay(300);
    const pools = await stakingService.getPools();
    return pools.find((pool) => pool.id === poolId) || null;
  },

  // Vraie transaction de staking (plus de simulation !)
  stake: async (
    poolId: string,
    amount: number,
    wallet: any // Vrai wallet Solana qui peut signer
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      if (!wallet.publicKey) {
        return { success: false, error: "Wallet non connecté" };
      }

      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );

      const program = getAnchorProgram(wallet, connection);

      // Extraire le strategy_id du poolId (format: "strategy-123")
      console.log("poolId", poolId);
      const strategyIdStr = poolId.replace("strategy-", "");
      const strategyId = parseInt(strategyIdStr, 10);
      if (isNaN(strategyId)) {
        throw new Error(
          `poolId mal formé: ${poolId} (strategyId extrait: ${strategyIdStr})`
        );
      }
      const strategyIdBN = new anchor.BN(strategyId);
      console.log("strategyId", strategyId);
      console.log("strategyIdBN", strategyIdBN);
      // Convertir le montant en lamports (SOL -> lamports)
      const amountLamports = Math.floor(amount * 1000000000);
      const amountBN = new anchor.BN(amountLamports);

      // Calculer les PDAs
      const [strategyPda] = await PublicKey.findProgramAddress(
        [Buffer.from("strategy"), strategyIdBN.toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID
      );

      const [userPositionPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from("user_position"),
          wallet.publicKey.toBuffer(),
          strategyPda.toBuffer(),
        ],
        PROGRAM_ID
      );

      const [strategyVaultPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from("strategy_vault"),
          strategyIdBN.toArrayLike(Buffer, "le", 8),
        ],
        PROGRAM_ID
      );

      // Récupérer les infos de la stratégie
      let strategy;
      try {
        strategy = await (program.account as any).strategy.fetch(strategyPda);
      } catch (e) {
        throw new Error(
          "La stratégie sélectionnée n'existe pas sur la blockchain. Veuillez rafraîchir la page."
        );
      }
      if (!strategy) {
        throw new Error(
          "La stratégie sélectionnée n'existe pas sur la blockchain. Veuillez rafraîchir la page."
        );
      }
      if (!strategy.underlyingToken) {
        throw new Error(
          "Le champ underlyingToken est manquant dans la stratégie."
        );
      }
      const underlyingTokenMint = new PublicKey(strategy.underlyingToken);
      const yieldTokenMint = new PublicKey(strategy.yieldTokenMint);
      console.log(
        "DEBUG underlyingTokenMint:",
        underlyingTokenMint?.toBase58?.() || underlyingTokenMint
      );

      // Calculer les comptes de tokens de l'utilisateur
      const userUnderlyingTokenAccount = await getAssociatedTokenAddress(
        underlyingTokenMint,
        wallet.publicKey
      );

      const userYieldTokenAccount = await getAssociatedTokenAddress(
        yieldTokenMint,
        wallet.publicKey
      );

      // Vérifier si le compte yield token de l'utilisateur existe
      let createYieldTokenAccountIx = null;
      try {
        await getAccount(connection, userYieldTokenAccount);
        console.log("✅ Compte yield token existe déjà");
      } catch (error) {
        console.log("🔧 Création du compte yield token nécessaire");
        createYieldTokenAccountIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userYieldTokenAccount,
          wallet.publicKey,
          yieldTokenMint
        );
      }

      console.log("🔍 DEBUG stake - Informations reçues:", {
        poolId_recu: poolId,
        amount_recu: amount,
        strategyId_extrait: strategyId,
        strategyIdBN: strategyIdBN.toString(),
      });

      console.log("🚀 Staking vers la stratégie:", {
        strategyId,
        strategyName: strategy.name,
        amount: `${amount} SOL (${amountLamports} lamports)`,
        strategyPda: strategyPda.toString(),
        userPosition: userPositionPda.toString(),
        vault: strategyVaultPda.toString(),
        userUnderlyingToken: userUnderlyingTokenAccount.toString(),
        userYieldTokenAccount: userYieldTokenAccount.toString(),
        needsYieldTokenCreation: !!createYieldTokenAccountIx,
      });

      // Si on a besoin de créer le compte yield token, on l'ajoute à la transaction
      let txHash;
      if (createYieldTokenAccountIx) {
        console.log(
          "🔧 Création du compte yield token + dépôt en une transaction"
        );
        const transaction = new Transaction();
        transaction.add(createYieldTokenAccountIx);
        console.log("underlyingTokenMint", underlyingTokenMint);
        console.log("type of underlyingTokenMint", typeof underlyingTokenMint);
        const depositIx = await program.methods
          .depositToStrategy(amountBN, strategyIdBN)
          .accountsPartial({
            user: wallet.publicKey,
            strategy: strategyPda,
            user_position: userPositionPda,
            underlying_token_mint: underlyingTokenMint,
            user_underlying_token: userUnderlyingTokenAccount,
            strategy_vault: strategyVaultPda,
            yield_token_mint: yieldTokenMint,
            user_yield_token_account: userYieldTokenAccount,
            token_program: TOKEN_PROGRAM_ID,
            associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
            system_program: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .instruction();

        transaction.add(depositIx);
        txHash = await wallet.sendTransaction(transaction, connection);
      } else {
        // Le compte existe déjà, on peut directement faire le dépôt
        console.log("✅ Dépôt direct (compte yield token existe)");
        txHash = await program.methods
          .depositToStrategy(amountBN, strategyIdBN)
          .accountsPartial({
            user: wallet.publicKey,
            strategy: strategyPda,
            user_position: userPositionPda,
            underlying_token_mint: underlyingTokenMint,
            user_underlying_token: userUnderlyingTokenAccount,
            strategy_vault: strategyVaultPda,
            yield_token_mint: yieldTokenMint,
            user_yield_token_account: userYieldTokenAccount,
            token_program: TOKEN_PROGRAM_ID,
            associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
            system_program: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc();
      }

      return {
        success: true,
        txHash: txHash,
      };
    } catch (error) {
      console.error("Erreur lors du staking:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  },

  // Simuler une transaction de unstaking
  unstake: async (
    poolId: string,
    amount: number,
    wallet: any
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    await delay(2000);

    const pool = await stakingService.getPool(poolId);
    if (!pool) {
      return {
        success: false,
        error: "Pool non trouvé",
      };
    }

    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2)}`,
    };
  },

  // Simuler la récupération des positions de staking
  getPositions: async (wallet: any): Promise<StakingPosition[]> => {
    await delay(800);
    return [
      {
        id: "1",
        poolId: "strategy-1",
        amount: 10,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 jours
        rewards: 0.23,
      },
    ];
  },
};
