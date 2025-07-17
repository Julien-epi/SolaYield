import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import rawIdl from '../utils/contracts-generated.json';

const idl = rawIdl as unknown as Idl;
const PROGRAM_ID = new PublicKey('BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');

export function getAnchorProgram(wallet: any, connection: Connection) {
  try {
    const provider = new AnchorProvider(
      connection, 
      wallet, 
      { 
        preflightCommitment: 'processed',
        commitment: 'processed'
      }
    );
    return new Program(idl, provider);
  } catch (error) {
    console.error('Error creating anchor program:', error);
    throw error;
  }
}