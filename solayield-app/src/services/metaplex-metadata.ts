import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
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
  // Corrige le cas où TOKEN_METADATA_PROGRAM_ID serait une string
  const metadataProgramId =
    typeof TOKEN_METADATA_PROGRAM_ID === "string"
      ? new PublicKey(TOKEN_METADATA_PROGRAM_ID)
      : TOKEN_METADATA_PROGRAM_ID;
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      metadataProgramId.toBuffer(),
      mint.toBuffer(),
    ],
    metadataProgramId
  );

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
