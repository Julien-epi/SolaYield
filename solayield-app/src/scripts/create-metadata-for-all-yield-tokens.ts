import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { getAnchorProgram } from "../services/anchor";
import { createTokenMetadata } from "../services/metaplex-metadata";
import * as anchor from "@coral-xyz/anchor";
import fs from "fs";

// CONFIGURATION
const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const ADMIN_KEYPAIR_PATH = process.env.ADMIN_KEYPAIR || "~/.config/solana/id.json";

function loadKeypair(path: string): Keypair {
  const expanded = path.replace(/^~\//, `${process.env.HOME}/`);
  const secret = JSON.parse(fs.readFileSync(expanded, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(secret));
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const adminKeypair = loadKeypair(ADMIN_KEYPAIR_PATH);
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  // Charger l'IDL et le programme
  const program = getAnchorProgram(wallet, connection);

  // Récupérer toutes les stratégies on-chain
  const strategies = await (program.account as any).strategy.all();
  console.log(`\n🔎 ${strategies.length} stratégies trouvées`);

  for (const strat of strategies) {
    const s = strat.account;
    const strategyId = s.strategyId?.toString() || "?";
    const yieldTokenMint = s.yieldTokenMint;
    if (!yieldTokenMint) {
      console.log(`❌ Pas de yieldTokenMint pour la stratégie ${strategyId}`);
      continue;
    }
    const name = `yToken ${strategyId}`;
    const symbol = `yTKN${strategyId}`;
    try {
      console.log(`\n➡️ Création metadata pour mint: ${yieldTokenMint.toString()} (${name})`);
      await createTokenMetadata({
        connection,
        mint: new PublicKey(yieldTokenMint),
        payer: adminKeypair,
        name,
        symbol,
        uri: "",
      });
      console.log(`✅ Metadata créée pour ${name}`);
    } catch (e: any) {
      if (e.message?.includes("already in use")) {
        console.log(`ℹ️ Metadata déjà existante pour ${name}`);
      } else {
        console.error(`❌ Erreur pour ${name}:`, e.message || e);
      }
    }
  }
  console.log("\n🎉 Script terminé");
}

main().catch((err) => {
  console.error("Erreur script:", err);
  process.exit(1);
}); 