import { PublicKey, Connection } from "@solana/web3.js";
import { getAnchorProgram } from "./anchor";
import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export interface YieldToken {
  id: string;
  name: string;
  symbol: string;
  underlyingToken: string;
  apy: number;
  price: number;
  totalSupply: number;
  availableSupply: number;
  maturityDate: Date;
  issuer: string;
  mint: string;
}

export interface Order {
  id: string;
  tokenId: string;
  type: "buy" | "sell";
  amount: number;
  price: number;
  total: number;
  seller: string;
  status: "open" | "filled" | "cancelled";
  createdAt: Date;
}

// Dummy data pour UI si pas de backend
const yieldTokens: YieldToken[] = [
  {
    id: "yt-sol-1",
    name: "SOL Yield Token 2024",
    symbol: "ySOL-2024",
    mint: "So11111111111111111111111111111111111111112",
    underlyingToken: "SOL",
    apy: 12,
    price: 1.05,
    totalSupply: 1000000,
    availableSupply: 500000,
    maturityDate: new Date("2024-12-31"),
    issuer: "SolaYield Protocol",
  },
  {
    id: "yt-usdc-1",
    name: "USDC Yield Token 2024",
    symbol: "yUSDC-2024",
    mint: "AotJP1BKp6DVM7VA21BAji7sG4m1JtpkunwAvx111XqE",
    underlyingToken: "USDC",
    apy: 8,
    price: 1.02,
    totalSupply: 2000000,
    availableSupply: 1000000,
    maturityDate: new Date("2024-12-31"),
    issuer: "SolaYield Protocol",
  },
];

const orders: Order[] = [
  {
    id: "1",
    tokenId: "yt-sol-1",
    type: "sell",
    amount: 100,
    price: 1.05,
    total: 105,
    seller: "0x123...",
    status: "open",
    createdAt: new Date(),
  },
  {
    id: "2",
    tokenId: "yt-usdc-1",
    type: "buy",
    amount: 500,
    price: 1.02,
    total: 510,
    seller: "0x456...",
    status: "open",
    createdAt: new Date(),
  },
];

// Helper delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper pour tokens
function getTokenSymbol(tokenMint: string): string {
  if (tokenMint === "So11111111111111111111111111111111111111112") return "SOL";
  if (tokenMint === "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr")
    return "USDC";
  return tokenMint.slice(0, 4) + "..." + tokenMint.slice(-4);
}

function marketplaceAccountToYieldToken(account: any): YieldToken {
  return {
    id: account.marketplaceId
      ? account.marketplaceId.toString()
      : account.yield_token_mint?.toString() ?? "",
    name: `Yield Token ${getTokenSymbol(
      account.underlying_token_mint?.toString() ?? ""
    )}`,
    symbol: getTokenSymbol(account.yield_token_mint?.toString() ?? ""),
    underlyingToken: getTokenSymbol(
      account.underlying_token_mint?.toString() ?? ""
    ),
    apy: 0, // Peut être rempli avec la Strategy
    price: account.best_ask_price
      ? Number(account.best_ask_price) / 1_000_000
      : 0,
    totalSupply: 0,
    availableSupply: 0,
    maturityDate: new Date(
      account.created_at ? Number(account.created_at) * 1000 : Date.now()
    ),
    issuer: account.admin?.toString() ?? "",
  };
}

export const marketplaceService = {
  // Fetch on-chain yield tokens (marketplaces)
  getYieldTokens: async (): Promise<YieldToken[]> => {
    try {
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );
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
      const marketplaces = await (program.account as any).marketplace.all();
      return marketplaces.map((m: any) =>
        marketplaceAccountToYieldToken(m.account)
      );
    } catch (e) {
      console.error("Erreur lors du fetch des marketplaces:", e);
      return [];
    }
  },

  // Get one yield token
  getYieldToken: async (tokenId: string): Promise<YieldToken | null> => {
    const tokens = await marketplaceService.getYieldTokens();
    return tokens.find((token) => token.id === tokenId) || null;
  },

  // Open orders, fake data
  getOpenOrders: async (): Promise<Order[]> => {
    await delay(400);
    return orders.filter((order) => order.status === "open");
  },

  // Create buy order, FAKE (pour UI)
  createBuyOrder: async (
    tokenId: string,
    amount: number,
    price: number,
    walletAddress: PublicKey
  ): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    await delay(1000);
    const token = await marketplaceService.getYieldToken(tokenId);
    if (!token) {
      return { success: false, error: "Token non trouvé" };
    }
    if (amount > token.availableSupply) {
      return {
        success: false,
        error: "Montant supérieur à l'offre disponible",
      };
    }
    const order: Order = {
      id: Math.random().toString(36).substring(7),
      tokenId,
      type: "buy",
      amount,
      price,
      total: amount * price,
      seller: walletAddress.toString(),
      status: "open",
      createdAt: new Date(),
    };
    orders.push(order);
    return { success: true, orderId: order.id };
  },

  // Create sell order, FAKE (pour UI)
  createSellOrder: async (
    tokenId: string,
    amount: number,
    price: number,
    walletAddress: PublicKey
  ): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    await delay(1000);
    const token = await marketplaceService.getYieldToken(tokenId);
    if (!token) {
      return { success: false, error: "Token non trouvé" };
    }
    const order: Order = {
      id: Math.random().toString(36).substring(7),
      tokenId,
      type: "sell",
      amount,
      price,
      total: amount * price,
      seller: walletAddress.toString(),
      status: "open",
      createdAt: new Date(),
    };
    orders.push(order);
    return { success: true, orderId: order.id };
  },

  // Execute order, FAKE (pour UI)
  executeOrder: async (
    orderId: string,
    walletAddress: PublicKey
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    await delay(2000);
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, error: "Ordre non trouvé" };
    }
    if (order.status !== "open") {
      return { success: false, error: "L'ordre n'est plus disponible" };
    }
    order.status = "filled";
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2)}`,
    };
  },

  /**
   * Place un ordre réel sur la blockchain avec signature utilisateur
   */
  placeOrderOnChain: async ({
    type,
    tokenId,
    amount,
    price,
    wallet,
    mint,
  }: {
    type: "buy" | "sell";
    tokenId: string;
    amount: number;
    price: number;
    wallet: any; // doit contenir publicKey, signTransaction, signAllTransactions
    mint: string;
  }): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      if (
        !wallet?.publicKey ||
        typeof wallet.signTransaction !== "function" ||
        typeof wallet.signAllTransactions !== "function"
      ) {
        return {
          success: false,
          error: "Wallet non connecté ou non compatible",
        };
      }

      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );
      const program = getAnchorProgram(wallet, connection);

      // Récupération du token (via la blockchain)
      const tokens = await marketplaceService.getYieldTokens();
      const token = tokens.find((t) => t.id === tokenId);
      if (!token) return { success: false, error: "Token non trouvé" };

      // marketplaceId <-> stratégie 1:1
      const strategyId = Number(token.id.replace(/\D/g, ""));
      const strategyIdBN = new anchor.BN(strategyId);

      const [strategyPda] = await PublicKey.findProgramAddress(
        [Buffer.from("strategy"), strategyIdBN.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [marketplacePda] = await PublicKey.findProgramAddress(
        [Buffer.from("marketplace"), strategyPda.toBuffer()],
        program.programId
      );
      const [orderCounterPda] = await PublicKey.findProgramAddress(
        [Buffer.from("order_counter")],
        program.programId
      );

      // Dummy orderId (en vrai => PDA avec counter)
      const orderId = Math.floor(Math.random() * 1e9);
      const orderType = type === "buy" ? 0 : 1;

      // Mints réels, à récupérer dynamiquement si multi-token
      console.log(">>>>>>> TOKEN", token);
      const yieldTokenMint = new PublicKey(token.id);
      const underlyingTokenMint = new PublicKey(
        "So11111111111111111111111111111111111111112"
      ); // TODO: adapte selon le yieldToken/marketplace réel

      // Comptes associés user
      const userYieldTokenAccount = await getAssociatedTokenAddress(
        yieldTokenMint,
        wallet.publicKey
      );
      const userUnderlyingTokenAccount = await getAssociatedTokenAddress(
        underlyingTokenMint,
        wallet.publicKey
      );

      // Debug log
      console.log("WALLET UTILISÉ", wallet);
      console.log("PRÊT À ENVOYER TX AVEC:", {
        user: wallet.publicKey.toBase58(),
        marketplace: marketplacePda.toBase58(),
        orderCounter: orderCounterPda.toBase58(),
        yieldTokenMint: yieldTokenMint.toBase58(),
        underlyingTokenMint: underlyingTokenMint.toBase58(),
        userYieldTokenAccount: userYieldTokenAccount.toBase58(),
        userUnderlyingTokenAccount: userUnderlyingTokenAccount.toBase58(),
      });

      // Anchor call : le wallet popup doit apparaître ici
      const tx = await program.methods
        .placeOrder(
          new anchor.BN(orderId),
          orderType,
          new anchor.BN(amount),
          new anchor.BN(Math.floor(price * 1_000_000)) // fixed 6 decimals
        )
        .accounts({
          user: wallet.publicKey,
          marketplace: marketplacePda,
          orderCounter: orderCounterPda,
          yieldTokenMint,
          underlyingTokenMint,
          userYieldTokenAccount,
          userUnderlyingTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      return { success: true, txHash: tx };
    } catch (e: any) {
      console.error("Erreur lors de l'envoi d'un ordre on-chain", e);
      return { success: false, error: e.message || e.toString() };
    }
  },

  /**
   * Redeem un yToken sur la blockchain (burn + récupération de l'underlying)
   */
  redeemYieldTokenOnChain: async ({
    tokenId,
    amount,
    wallet,
  }: {
    tokenId: string;
    amount: number;
    wallet: any;
  }): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    try {
      if (
        !wallet?.publicKey ||
        typeof wallet.signTransaction !== "function" ||
        typeof wallet.signAllTransactions !== "function"
      ) {
        return {
          success: false,
          error: "Wallet non connecté ou non compatible",
        };
      }
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );
      const program = getAnchorProgram(wallet, connection);

      // 1. Récupérer le token yield
      const tokens = await marketplaceService.getYieldTokens();
      const token = tokens.find((t) => t.id === tokenId);
      if (!token) return { success: false, error: "Token non trouvé" };
      const strategyId = Number(token.id.replace(/\D/g, ""));
      const strategyIdBN = new anchor.BN(strategyId);
      const [strategyPda] = await PublicKey.findProgramAddress(
        [Buffer.from("strategy"), strategyIdBN.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const yieldTokenMint = new PublicKey(token.id);
      const underlyingTokenMint = new PublicKey(
        "So11111111111111111111111111111111111111112"
      );
      const userYieldTokenAccount = await getAssociatedTokenAddress(
        yieldTokenMint,
        wallet.publicKey
      );
      const userUnderlyingTokenAccount = await getAssociatedTokenAddress(
        underlyingTokenMint,
        wallet.publicKey
      );

      // Debug
      console.log("Redeem: accounts", {
        user: wallet.publicKey.toBase58(),
        strategy: strategyPda.toBase58(),
        userYieldTokenAccount: userYieldTokenAccount.toBase58(),
        userUnderlyingToken: userUnderlyingTokenAccount.toBase58(),
        yieldTokenMint: yieldTokenMint.toBase58(),
        underlyingTokenMint: underlyingTokenMint.toBase58(),
      });

      const tx = await program.methods
        .redeemYieldTokens(new anchor.BN(amount), strategyIdBN)
        .accounts({
          user: wallet.publicKey,
          strategy: strategyPda,
          userYieldTokenAccount,
          userUnderlyingToken: userUnderlyingTokenAccount,
          yieldTokenMint,
          underlyingTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      return { success: true, txHash: tx };
    } catch (e: any) {
      console.error("Erreur redeem", e);
      return { success: false, error: e.message || e.toString() };
    }
  },
};
