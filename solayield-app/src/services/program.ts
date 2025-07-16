import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import idl from '../utils/contracts.json';

// Configuration du réseau
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');

export class SolaYieldProgram {
  private static instance: SolaYieldProgram;
  private connection: Connection;
  private programId: PublicKey;
  private program: any = null;
  private provider: AnchorProvider | null = null;

  private constructor() {
    this.connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
    this.programId = PROGRAM_ID;
  }

  public static getInstance(): SolaYieldProgram {
    if (!SolaYieldProgram.instance) {
      SolaYieldProgram.instance = new SolaYieldProgram();
    }
    return SolaYieldProgram.instance;
  }

  public async initializeProgram(wallet: any): Promise<any> {
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Créer le provider
      this.provider = new AnchorProvider(
        this.connection,
        wallet,
        { 
          preflightCommitment: 'processed',
          commitment: 'confirmed'
        }
      );

      // Créer le programme avec l'IDL importé
      this.program = new anchor.Program(idl as anchor.Idl, this.provider);
      
      return this.program;
    } catch (error) {
      console.error('Error creating program:', error);
      throw new Error('Failed to initialize program connection. Please try again.');
    }
  }

  public getProgram(): any {
    if (!this.program) {
      throw new Error('Program not initialized. Call initializeProgram first.');
    }
    return this.program;
  }

  public getConnection(): Connection {
    return this.connection;
  }

  public getProgramId(): PublicKey {
    return this.programId;
  }

  // Utilitaires pour les PDAs
  public static findStrategyPDA(strategyId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("strategy"),
        new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)
      ],
      PROGRAM_ID
    );
  }

  public static findUserPositionPDA(user: PublicKey, strategy: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_position"),
        user.toBuffer(),
        strategy.toBuffer()
      ],
      PROGRAM_ID
    );
  }

  public static findYieldTokenMintPDA(strategyId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("yield_token"),
        new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)
      ],
      PROGRAM_ID
    );
  }

  public static findMarketplacePDA(strategyAddress: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("marketplace"),
        strategyAddress.toBuffer()
      ],
      PROGRAM_ID
    );
  }

  public static findOrderPDA(user: PublicKey, orderId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("order"),
        user.toBuffer(),
        new anchor.BN(orderId).toArrayLike(Buffer, "le", 8)
      ],
      PROGRAM_ID
    );
  }

  public static findStrategyCounterPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_counter")],
      PROGRAM_ID
    );
  }

  public static findMarketplaceCounterPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace_counter")],
      PROGRAM_ID
    );
  }

  public static findOrderCounterPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("order_counter")],
      PROGRAM_ID
    );
  }
}

export const solaYieldProgram = SolaYieldProgram.getInstance(); 