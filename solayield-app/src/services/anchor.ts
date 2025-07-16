import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@project-serum/anchor';
import rawIdl from '../utils/contracts.json';

const idl = rawIdl as unknown as Idl;
const PROGRAM_ID = new PublicKey('BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az');

export function getAnchorProgram(wallet: any, connection: Connection) {
  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
  return new Program(idl, PROGRAM_ID, provider);
}