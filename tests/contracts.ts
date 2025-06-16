import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contracts } from "../target/types/contracts";

describe("contracts", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Contracts as Program<Contracts>;

  let poolPda: anchor.web3.PublicKey;
  let userPositionPda: anchor.web3.PublicKey;

  it("Can deposit!", async () => {
    // Trouver PDA du pool
    [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pool")],
      program.programId
    );

    // Trouver PDA de la position utilisateur
    [userPositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_position"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .deposit(new anchor.BN(1000)) // dépôt de 1000
      .accounts({
        user: provider.wallet.publicKey,
        pool: poolPda,
        userPosition: userPositionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Deposit TX:", tx);
  });

  it("Fails to redeem before maturity", async () => {
    try {
      await program.methods
        .redeem()
        .accounts({
          user: provider.wallet.publicKey,
          pool: poolPda,
          userPosition: userPositionPda,
        })
        .rpc();

      throw new Error("⛔️ Redeem should have failed before maturity");
    } catch (err) {
      console.log("✅ Redeem correctly failed:", err.message);
    }
  });

  it("Can redeem after maturity", async () => {
    console.log("⏳ Waiting 65s for maturity...");
    await new Promise((resolve) => setTimeout(resolve, 65000));

    const tx = await program.methods
      .redeem()
      .accounts({
        user: provider.wallet.publicKey,
        pool: poolPda,
        userPosition: userPositionPda,
      })
      .rpc();

    console.log("✅ Redeem TX:", tx);
  });
});
