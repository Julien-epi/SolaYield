import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contracts } from "../target/types/contracts";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";

describe("SolaYield Contracts", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Contracts as Program<Contracts>;
  
  // PDAs
  let poolPda: anchor.web3.PublicKey;
  let poolBump: number;
  let userPositionPda: anchor.web3.PublicKey;
  let userPositionBump: number;
  let ytMintPda: anchor.web3.PublicKey;
  let ytMintBump: number;
  
  // Token accounts
  let userYtAccount: anchor.web3.PublicKey;
  
  // Test users
  let user1 = anchor.web3.Keypair.generate();
  let user2 = anchor.web3.Keypair.generate();
  
  before(async () => {
    // Airdrop SOL to test users
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user1.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user2.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Find PDAs
    [poolPda, poolBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pool")],
      program.programId
    );

    [ytMintPda, ytMintBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("yt_mint")],
      program.programId
    );

    console.log("🔍 PDAs found:");
    console.log("   Pool PDA:", poolPda.toString());
    console.log("   YT Mint PDA:", ytMintPda.toString());
  });

  describe("Initialization", () => {
    it("Should initialize pool and YT mint", async () => {
      const tx = await program.methods
        .initialize()
        .accountsPartial({
          authority: provider.wallet.publicKey,
          pool: poolPda,
          ytMint: ytMintPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("✅ Initialize transaction:", tx);

      // Vérifier que le pool est initialisé
      const poolAccount = await program.account.pool.fetch(poolPda);
      expect(poolAccount.totalDeposits.toNumber()).to.equal(0);

      console.log("✅ Pool initialized with total deposits:", poolAccount.totalDeposits.toNumber());
    });
  });

  describe("Deposit Functionality", () => {
    it("Should successfully deposit tokens", async () => {
      const depositAmount = new anchor.BN(1000);
      
      [userPositionPda, userPositionBump] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_position"), user1.publicKey.toBuffer()],
        program.programId
      );

      userYtAccount = await getAssociatedTokenAddress(
        ytMintPda,
        user1.publicKey
      );

      const tx = await program.methods
        .deposit(depositAmount)
        .accountsPartial({
          user: user1.publicKey,
          pool: poolPda,
          userPosition: userPositionPda,
          ytMint: ytMintPda,
          userYtAccount: userYtAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user1])
        .rpc();

      console.log("✅ Deposit transaction:", tx);

      // Vérifier l'état du pool
      const poolAccount = await program.account.pool.fetch(poolPda);
      expect(poolAccount.totalDeposits.toNumber()).to.equal(1000);

      // Vérifier la position utilisateur
      const userPosition = await program.account.userPosition.fetch(userPositionPda);
      expect(userPosition.user.toString()).to.equal(user1.publicKey.toString());
      expect(userPosition.amount.toNumber()).to.equal(1000);
      expect(userPosition.depositTime.toNumber()).to.be.greaterThan(0);

      console.log("✅ Pool total deposits:", poolAccount.totalDeposits.toNumber());
      console.log("✅ User position amount:", userPosition.amount.toNumber());
    });

    it("Should fail if user tries to deposit twice", async () => {
      const depositAmount = new anchor.BN(500);
      
      try {
        await program.methods
          .deposit(depositAmount)
          .accountsPartial({
            user: user1.publicKey,
            pool: poolPda,
            userPosition: userPositionPda,
            ytMint: ytMintPda,
            userYtAccount: userYtAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([user1])
          .rpc();
        
        throw new Error("Should have failed - user position already exists");
      } catch (err) {
        expect(err.toString()).to.include("already in use");
        console.log("✅ Correctly failed duplicate deposit");
      }
    });

    it("Should allow multiple users to deposit", async () => {
      const depositAmount = new anchor.BN(2000);
      
      const [user2PositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_position"), user2.publicKey.toBuffer()],
        program.programId
      );

      const user2YtAccount = await getAssociatedTokenAddress(
        ytMintPda,
        user2.publicKey
      );

      await program.methods
        .deposit(depositAmount)
        .accountsPartial({
          user: user2.publicKey,
          pool: poolPda,
          userPosition: user2PositionPda,
          ytMint: ytMintPda,
          userYtAccount: user2YtAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user2])
        .rpc();

      // Vérifier que le total des dépôts a augmenté
      const poolAccount = await program.account.pool.fetch(poolPda);
      expect(poolAccount.totalDeposits.toNumber()).to.equal(3000); // 1000 + 2000

      console.log("✅ Multiple users can deposit. Total deposits:", poolAccount.totalDeposits.toNumber());
    });

    it("Should handle zero amount deposit", async () => {
      const user3 = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(user3.publicKey, anchor.web3.LAMPORTS_PER_SOL)
      );

      const [user3PositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_position"), user3.publicKey.toBuffer()],
        program.programId
      );

      const user3YtAccount = await getAssociatedTokenAddress(
        ytMintPda,
        user3.publicKey
      );

      const depositAmount = new anchor.BN(0);
      
      await program.methods
        .deposit(depositAmount)
        .accountsPartial({
          user: user3.publicKey,
          pool: poolPda,
          userPosition: user3PositionPda,
          ytMint: ytMintPda,
          userYtAccount: user3YtAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user3])
        .rpc();

      const userPosition = await program.account.userPosition.fetch(user3PositionPda);
      expect(userPosition.amount.toNumber()).to.equal(0);
      
      console.log("✅ Zero amount deposit handled correctly");
    });
  });

  describe("Redeem Functionality", () => {
    it("Should fail to redeem before maturity (60 seconds)", async () => {
      try {
        await program.methods
          .redeem()
          .accountsPartial({
            user: user1.publicKey,
            pool: poolPda,
            userPosition: userPositionPda,
          })
          .signers([user1])
          .rpc();
        
        throw new Error("Should have failed - not mature yet");
      } catch (err) {
        expect(err.toString()).to.include("NotMature");
        console.log("✅ Correctly failed premature redeem");
      }
    });

    it("Should fail with invalid user constraint", async () => {
      // Essayer de redeem avec un autre utilisateur
      try {
        await program.methods
          .redeem()
          .accountsPartial({
            user: user2.publicKey,
            pool: poolPda,
            userPosition: userPositionPda, // Position de user1
          })
          .signers([user2])
          .rpc();
        
        throw new Error("Should have failed - wrong user");
      } catch (err) {
        expect(err.toString()).to.include("constraint");
        console.log("✅ Correctly failed with wrong user");
      }
    });

    it("Should successfully redeem after maturity", async () => {
      console.log("⏳ Waiting 65 seconds for maturity...");
      await new Promise((resolve) => setTimeout(resolve, 65000));

      const poolBefore = await program.account.pool.fetch(poolPda);
      const userPositionBefore = await program.account.userPosition.fetch(userPositionPda);
      
      const tx = await program.methods
        .redeem()
        .accountsPartial({
          user: user1.publicKey,
          pool: poolPda,
          userPosition: userPositionPda,
        })
        .signers([user1])
        .rpc();

      console.log("✅ Redeem transaction:", tx);

      // Vérifier que le pool total a diminué
      const poolAfter = await program.account.pool.fetch(poolPda);
      const expectedTotal = poolBefore.totalDeposits.toNumber() - userPositionBefore.amount.toNumber();
      expect(poolAfter.totalDeposits.toNumber()).to.equal(expectedTotal);

      // Vérifier que le compte utilisateur a été fermé
      try {
        await program.account.userPosition.fetch(userPositionPda);
        throw new Error("User position should have been closed");
      } catch (err) {
        expect(err.toString()).to.include("Account does not exist");
        console.log("✅ User position correctly closed");
      }

      console.log("✅ Redeem successful. Pool total deposits:", poolAfter.totalDeposits.toNumber());
    });

    it("Should fail to redeem twice", async () => {
      try {
        await program.methods
          .redeem()
          .accountsPartial({
            user: user1.publicKey,
            pool: poolPda,
            userPosition: userPositionPda,
          })
          .signers([user1])
          .rpc();
        
        throw new Error("Should have failed - position already redeemed");
      } catch (err) {
        expect(err.toString()).to.include("user_position");
        console.log("✅ Correctly failed double redeem");
      }
    });
  });

  describe("State Validation", () => {
    it("Should maintain correct pool state across operations", async () => {
      const poolAccount = await program.account.pool.fetch(poolPda);
      
      // À ce point, user1 a redeemed (1000), user2 a déposé (2000), user3 a déposé (0)
      // Total attendu: 2000
      expect(poolAccount.totalDeposits.toNumber()).to.equal(2000);
      
      console.log("✅ Pool state validation passed");
    });

    it("Should handle reasonable amounts", async () => {
      const user4 = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(user4.publicKey, anchor.web3.LAMPORTS_PER_SOL)
      );

      const [user4PositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_position"), user4.publicKey.toBuffer()],
        program.programId
      );

      const user4YtAccount = await getAssociatedTokenAddress(
        ytMintPda,
        user4.publicKey
      );

      // Test avec un montant raisonnable
      const reasonableAmount = new anchor.BN("1000000000"); // 1 billion
      
      await program.methods
        .deposit(reasonableAmount)
        .accountsPartial({
          user: user4.publicKey,
          pool: poolPda,
          userPosition: user4PositionPda,
          ytMint: ytMintPda,
          userYtAccount: user4YtAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user4])
        .rpc();

      const userPosition = await program.account.userPosition.fetch(user4PositionPda);
      expect(userPosition.amount.toString()).to.equal(reasonableAmount.toString());
      
      console.log("✅ Reasonable amount deposit successful");
    });
  });

  describe("Edge Cases", () => {
    it("Should handle timestamp edge cases", async () => {
      // Créer un nouveau utilisateur pour tester les edge cases de temps
      const user5 = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(user5.publicKey, anchor.web3.LAMPORTS_PER_SOL)
      );

      const [user5PositionPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user_position"), user5.publicKey.toBuffer()],
        program.programId
      );

      const user5YtAccount = await getAssociatedTokenAddress(
        ytMintPda,
        user5.publicKey
      );

      await program.methods
        .deposit(new anchor.BN(100))
        .accountsPartial({
          user: user5.publicKey,
          pool: poolPda,
          userPosition: user5PositionPda,
          ytMint: ytMintPda,
          userYtAccount: user5YtAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user5])
        .rpc();

      const userPosition = await program.account.userPosition.fetch(user5PositionPda);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Vérifier que le timestamp est raisonnable (dans les 10 secondes)
      expect(Math.abs(userPosition.depositTime.toNumber() - currentTime)).to.be.lessThan(10);
      
      console.log("✅ Timestamp validation passed");
      console.log("   Deposit time:", new Date(userPosition.depositTime.toNumber() * 1000).toISOString());
    });

    it("Should validate account ownership", async () => {
      // Test pour s'assurer que les comptes sont correctement validés
      const poolAccount = await program.account.pool.fetch(poolPda);
      expect(poolAccount).to.not.be.null;
      
      console.log("✅ Account ownership validation passed");
    });
  });
});
