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
  // Convertir SOL en wrapped SOL
  wrapSol: async (
    amount: number,
    wallet: any
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      if (!wallet.publicKey) {
        return { success: false, error: "Wallet non connecté" };
      }

      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );

      // Adresse du wrapped SOL mint
      const wrappedSolMint = new PublicKey("So11111111111111111111111111111111111111112");
      
      // Montant en lamports
      const amountLamports = Math.floor(amount * 1000000000);
      
      // Vérifier le solde
      const balance = await connection.getBalance(wallet.publicKey);
      const reservedForFees = 0.005 * 1000000000; // 0.005 SOL pour les frais
      const requiredBalance = amountLamports + reservedForFees;
      
      if (balance < requiredBalance) {
        const availableForWrapping = Math.max(0, (balance - reservedForFees) / 1000000000);
        return { 
          success: false, 
          error: `Solde insuffisant. Disponible pour wrapping: ${availableForWrapping.toFixed(6)} SOL` 
        };
      }

      // Calculer l'adresse du compte wrapped SOL de l'utilisateur
      const userWrappedSolAccount = await getAssociatedTokenAddress(
        wrappedSolMint,
        wallet.publicKey
      );

      const transaction = new Transaction();

      // Vérifier si le compte existe déjà
      let accountExists = false;
      try {
        await getAccount(connection, userWrappedSolAccount);
        accountExists = true;
      } catch (error) {
        // Le compte n'existe pas, l'ajouter à la transaction
        const createAccountIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userWrappedSolAccount,
          wallet.publicKey,
          wrappedSolMint
        );
        transaction.add(createAccountIx);
      }

      // Ajouter l'instruction pour transférer SOL vers le compte wrapped SOL
      transaction.add(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: userWrappedSolAccount,
          lamports: amountLamports,
        })
      );

      // Ajouter l'instruction pour synchroniser le compte wrapped SOL
      transaction.add(
        new anchor.web3.TransactionInstruction({
          keys: [
            { pubkey: userWrappedSolAccount, isSigner: false, isWritable: true },
          ],
          programId: TOKEN_PROGRAM_ID,
          data: Buffer.from([17]), // SyncNative instruction
        })
      );

      // Envoyer la transaction
      const txHash = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(txHash, "confirmed");

      return {
        success: true,
        txHash: txHash,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors du wrapping",
      };
    }
  },

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
      const strategyIdStr = poolId.replace("strategy-", "");
      const strategyId = parseInt(strategyIdStr, 10);
      if (isNaN(strategyId)) {
        throw new Error(
          `poolId mal formé: ${poolId} (strategyId extrait: ${strategyIdStr})`
        );
      }
      const strategyIdBN = new anchor.BN(strategyId);
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
          `Le champ underlyingToken est manquant dans la stratégie. Champs disponibles: ${Object.keys(strategy).join(', ')}`
        );
      }
      if (!strategy.yieldTokenMint) {
        throw new Error(
          `Le champ yieldTokenMint est manquant dans la stratégie. Champs disponibles: ${Object.keys(strategy).join(', ')}`
        );
      }
      
      const underlyingTokenMint = new PublicKey(strategy.underlyingToken);
      const yieldTokenMint = new PublicKey(strategy.yieldTokenMint);

      // Vérifier si c'est du wrapped SOL
      const isWrappedSol = underlyingTokenMint.toString() === "So11111111111111111111111111111111111111112";

      // Calculer les comptes de tokens de l'utilisateur
      const userUnderlyingTokenAccount = await getAssociatedTokenAddress(
        underlyingTokenMint,
        wallet.publicKey
      );

      const userYieldTokenAccount = await getAssociatedTokenAddress(
        yieldTokenMint,
        wallet.publicKey
      );



      // Vérifier le solde - pour SOL, on vérifie le solde natif
      if (isWrappedSol) {
        // Pour SOL, vérifier le solde natif + frais de transaction + rent
        const balance = await connection.getBalance(wallet.publicKey);
        
        // Réserver environ 0.01 SOL pour les frais de transaction et rent
        const reservedForFees = 0.01 * 1000000000; // 0.01 SOL en lamports
        const requiredBalance = amountLamports + reservedForFees;
        
        if (balance < requiredBalance) {
          const availableForStaking = Math.max(0, (balance - reservedForFees) / 1000000000);
          throw new Error(`Solde SOL insuffisant. Vous avez ${balance / 1000000000} SOL mais vous essayez de staker ${amount} SOL. Montant maximum disponible pour le staking : ${availableForStaking.toFixed(6)} SOL (0.01 SOL réservé pour les frais)`);
        }
      } else {
        // Pour les autres tokens, vérifier le compte de tokens associé
        try {
          const underlyingTokenAccountInfo = await getAccount(connection, userUnderlyingTokenAccount);
          
          if (underlyingTokenAccountInfo.amount < BigInt(amountLamports)) {
            throw new Error(`Solde de tokens insuffisant. Vous avez ${underlyingTokenAccountInfo.amount} mais vous essayez de staker ${amountLamports}`);
          }
        } catch (error) {
          throw new Error("Votre compte de tokens n'existe pas ou n'a pas suffisamment de tokens");
        }
      }

      // Effectuer le dépôt
      let txHash;
      try {
        txHash = await program.methods
          .depositToStrategy(amountBN, strategyIdBN)
          .accounts({
            user: wallet.publicKey,
            strategy: strategyPda,
            user_position: userPositionPda,
            underlyingTokenMint: underlyingTokenMint,
            userUnderlyingToken: userUnderlyingTokenAccount,
            strategyVault: strategyVaultPda,
            yieldTokenMint: yieldTokenMint,
            userYieldTokenAccount: userYieldTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .rpc();
      } catch (rpcError: any) {
        console.error("Erreur lors du dépôt:", rpcError);
        if (rpcError.logs) {
          console.error("Transaction logs:", rpcError.logs);
        }
        throw rpcError;
      }

      return {
        success: true,
        txHash: txHash,
      };
    } catch (error) {
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
