import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  createCreateMetadataAccountV3Instruction,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";

export async function createTokenMetadata({
  connection,
  mint,
  payer,
  name,
  symbol,
  uri = "",
}: {
  connection: Connection;
  mint: PublicKey;
  payer: any; // doit avoir .publicKey et .signTransaction
  name: string;
  symbol: string;
  uri?: string;
}) {
  // Utilise la fonction utilitaire Metaplex pour le PDA
  const metadataPda = findMetadataPda(mint);

  const accounts = {
    metadata: metadataPda,
    mint,
    mintAuthority: payer.publicKey,
    payer: payer.publicKey,
    updateAuthority: payer.publicKey,
  };

  const data = {
    name,
    symbol,
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const ix = createCreateMetadataAccountV3Instruction(
    {
      ...accounts,
    },
    {
      createMetadataAccountArgsV3: {
        data,
        isMutable: true,
        collectionDetails: null,
      },
    }
  );

  const tx = new Transaction().add(ix);
  const txid = await payer.sendTransaction(tx, connection);
  await connection.confirmTransaction(txid, "confirmed");
  return txid;
}
