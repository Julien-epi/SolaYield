# 🌾 SolaYield - Guide d'Intégration pour Développeurs

## 📋 Vue d'ensemble

SolaYield est un protocole de yield farming sur Solana permettant aux utilisateurs de déposer des SOL, recevoir des tokens de yield (ySolana), et trader ces tokens sur un marketplace P2P.

### ✅ Statut du Contrat
- **Statut**: 🟢 PRÊT POUR L'INTÉGRATION
- **Network**: Solana Devnet
- **Program ID**: `BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az`
- **Toutes les instructions testées et fonctionnelles**

---

## 🏗️ Architecture du Protocole

### Comptes Principaux
- **Strategy**: Définit une stratégie de yield avec APY configuré
- **UserPosition**: Position d'un utilisateur dans une stratégie
- **Marketplace**: Marketplace pour trader les yield tokens
- **TradeOrder**: Ordres d'achat/vente sur le marketplace

### Fonctionnalités Clés
1. **Yield Farming**: Dépôt de SOL → Réception de ySolana + yield
2. **Marketplace P2P**: Trade des yield tokens entre utilisateurs
3. **Multi-stratégies**: Support de multiples stratégies avec APY différents
4. **Gestion Admin**: Création et configuration des stratégies

---

## 🚀 Démarrage Rapide

### 1. Installation

```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

### 2. Configuration de Base

```javascript
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

// Configuration
const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Charger l'IDL
const idl = await fetch('./deployed-idl.json').then(r => r.json());
const program = new anchor.Program(idl, PROGRAM_ID, provider);
```

### 3. Connexion Wallet

```javascript
import { Wallet } from "@solana/wallet-adapter-react";

const provider = new anchor.AnchorProvider(connection, wallet, {});
anchor.setProvider(provider);
```

---

## 🔧 Instructions Principales

### 1. Initialisation du Protocole (Admin uniquement)

```javascript
async function initializeProtocol() {
  const [strategyCounter] = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy_counter")],
    program.programId
  );

  await program.methods
    .initializeProtocol()
    .accounts({
      admin: wallet.publicKey,
      strategyCounter,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
```

### 2. Créer une Stratégie (Admin uniquement)

```javascript
async function createStrategy(name, apyBasisPoints, strategyId) {
  const [strategy] = PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  
  const [yieldTokenMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("yield_token"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  await program.methods
    .createStrategy(name, apyBasisPoints, new anchor.BN(strategyId))
    .accounts({
      admin: wallet.publicKey,
      strategy,
      strategyCounter,
      underlyingToken: NATIVE_SOL_MINT,
      yieldTokenMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}

// Exemple: Créer une stratégie avec 10% APY
await createStrategy("SOL Staking", 1000, 0); // 1000 = 10.00%
```

### 3. Déposer dans une Stratégie

```javascript
async function depositToStrategy(amount, strategyId) {
  const [strategy] = getStrategyPDA(strategyId);
  const [userPosition] = getUserPositionPDA(wallet.publicKey, strategy);
  const [yieldTokenMint] = getYieldTokenMintPDA(strategyId);
  
  const userYieldTokenAccount = await getAssociatedTokenAddress(
    yieldTokenMint,
    wallet.publicKey
  );

  await program.methods
    .depositToStrategy(new anchor.BN(amount * LAMPORTS_PER_SOL), new anchor.BN(strategyId))
    .accounts({
      user: wallet.publicKey,
      strategy,
      userPosition,
      underlyingTokenMint: NATIVE_SOL_MINT,
      userUnderlyingToken: wallet.publicKey,
      strategyVault: getStrategyVaultPDA(strategyId)[0],
      yieldTokenMint,
      userYieldTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}

// Exemple: Déposer 1.5 SOL dans la stratégie 0
await depositToStrategy(1.5, 0);
```

### 4. Réclamer le Yield

```javascript
async function claimYield(strategyId) {
  const [strategy] = getStrategyPDA(strategyId);
  const [userPosition] = getUserPositionPDA(wallet.publicKey, strategy);
  const [yieldTokenMint] = getYieldTokenMintPDA(strategyId);
  
  await program.methods
    .claimYield(new anchor.BN(strategyId))
    .accounts({
      user: wallet.publicKey,
      strategy,
      userPosition,
      yieldTokenMint,
      userYieldTokenAccount: await getAssociatedTokenAddress(yieldTokenMint, wallet.publicKey),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}
```

### 5. Retirer de la Stratégie

```javascript
async function withdrawFromStrategy(amount, strategyId) {
  const [strategy] = getStrategyPDA(strategyId);
  const [userPosition] = getUserPositionPDA(wallet.publicKey, strategy);
  
  await program.methods
    .withdrawFromStrategy(new anchor.BN(amount * LAMPORTS_PER_SOL), new anchor.BN(strategyId))
    .accounts({
      user: wallet.publicKey,
      strategy,
      userPosition,
      underlyingTokenMint: NATIVE_SOL_MINT,
      userUnderlyingToken: wallet.publicKey,
      strategyVault: getStrategyVaultPDA(strategyId)[0],
      yieldTokenMint: getYieldTokenMintPDA(strategyId)[0],
      userYieldTokenAccount: await getAssociatedTokenAddress(
        getYieldTokenMintPDA(strategyId)[0], 
        wallet.publicKey
      ),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}
```

---

## 🏪 Marketplace Trading

### 1. Créer un Marketplace

```javascript
async function createMarketplace(yieldTokenMint, tradingFee) {
  const [marketplace] = getMarketplacePDA(yieldTokenMint);
  
  await program.methods
    .createMarketplace(tradingFee)
    .accounts({
      admin: wallet.publicKey,
      marketplace,
      yieldTokenMint,
      marketplaceCounter: getMarketplaceCounterPDA()[0],
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
```

### 2. Placer un Ordre

```javascript
async function placeOrder(marketplaceId, orderType, amount, price) {
  const [marketplace] = getMarketplacePDA(getYieldTokenMintPDA(marketplaceId)[0]);
  const [order] = getOrderPDA(wallet.publicKey, marketplace, orderCounter);
  
  await program.methods
    .placeOrder(orderType, new anchor.BN(amount), new anchor.BN(price))
    .accounts({
      user: wallet.publicKey,
      marketplace,
      order,
      yieldTokenMint: getYieldTokenMintPDA(marketplaceId)[0],
      userYieldTokenAccount: await getAssociatedTokenAddress(/* ... */),
      orderCounter: getOrderCounterPDA()[0],
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

// Exemple: Ordre de vente de 100 tokens à 1.05 SOL chacun
await placeOrder(0, { sell: {} }, 100, 1.05 * LAMPORTS_PER_SOL);
```

### 3. Exécuter un Trade

```javascript
async function executeTrade(buyOrderId, sellOrderId) {
  await program.methods
    .executeTrade(new anchor.BN(buyOrderId), new anchor.BN(sellOrderId))
    .accounts({
      buyer: buyerPublicKey,
      seller: sellerPublicKey,
      marketplace,
      buyOrder,
      sellOrder,
      yieldTokenMint,
      // ... autres comptes
    })
    .rpc();
}
```

---

## 🛠️ Fonctions Utilitaires (PDAs)

```javascript
// Calculer les Program Derived Addresses
function getStrategyPDA(strategyId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );
}

function getUserPositionPDA(user, strategy) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_position"), user.toBuffer(), strategy.toBuffer()],
    program.programId
  );
}

function getYieldTokenMintPDA(strategyId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("yield_token"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );
}

function getStrategyVaultPDA(strategyId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy_vault"), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );
}
```

---

## 📊 Lecture des Données

### Obtenir les Informations d'une Stratégie

```javascript
async function getStrategyInfo(strategyId) {
  const [strategy] = getStrategyPDA(strategyId);
  const strategyAccount = await program.account.strategy.fetch(strategy);
  
  return {
    name: strategyAccount.name,
    apy: strategyAccount.apy.toNumber() / 100, // En pourcentage
    totalDeposits: strategyAccount.totalDeposits.toNumber() / LAMPORTS_PER_SOL,
    isActive: strategyAccount.isActive,
    createdAt: new Date(strategyAccount.createdAt.toNumber() * 1000)
  };
}
```

### Obtenir la Position Utilisateur

```javascript
async function getUserPosition(userPublicKey, strategyId) {
  const [strategy] = getStrategyPDA(strategyId);
  const [userPosition] = getUserPositionPDA(userPublicKey, strategy);
  
  try {
    const positionAccount = await program.account.userPosition.fetch(userPosition);
    return {
      depositedAmount: positionAccount.depositedAmount.toNumber() / LAMPORTS_PER_SOL,
      yieldTokensMinted: positionAccount.yieldTokensMinted.toString(),
      depositTime: new Date(positionAccount.depositTime.toNumber() * 1000),
      lastYieldClaim: new Date(positionAccount.lastYieldClaim.toNumber() * 1000),
      totalYieldClaimed: positionAccount.totalYieldClaimed.toString()
    };
  } catch (error) {
    return null; // Position n'existe pas
  }
}
```

---

## 🎯 Cas d'Usage Typiques

### 1. Application de Yield Farming Simple

```javascript
// 1. L'utilisateur connecte son wallet
// 2. Afficher les stratégies disponibles
const strategies = await Promise.all([0, 1, 2].map(id => getStrategyInfo(id)));

// 3. L'utilisateur choisit une stratégie et dépose
await depositToStrategy(amount, selectedStrategyId);

// 4. Périodiquement, l'utilisateur peut réclamer ses yields
await claimYield(selectedStrategyId);

// 5. L'utilisateur peut retirer ses fonds
await withdrawFromStrategy(amount, selectedStrategyId);
```

### 2. Marketplace de Yield Tokens

```javascript
// 1. Créer le marketplace (admin)
await createMarketplace(yieldTokenMint, 250); // 2.5% de frais

// 2. Les utilisateurs placent des ordres
await placeOrder(marketplaceId, { buy: {} }, amount, price);
await placeOrder(marketplaceId, { sell: {} }, amount, price);

// 3. Exécution automatique des trades compatibles
await executeTrade(buyOrderId, sellOrderId);
```

---

## 🔐 Sécurité et Bonnes Pratiques

### 1. Validation des Montants
```javascript
// Toujours valider les montants avant transaction
if (amount <= 0 || amount > userBalance) {
  throw new Error("Montant invalide");
}
```

### 2. Gestion des Erreurs
```javascript
try {
  await depositToStrategy(amount, strategyId);
} catch (error) {
  if (error.code === 6000) {
    console.error("Stratégie non active");
  } else if (error.code === 6002) {
    console.error("Solde insuffisant");
  }
}
```

### 3. Vérification des Comptes
```javascript
// Vérifier que la stratégie existe avant interaction
const strategyAccount = await connection.getAccountInfo(strategy);
if (!strategyAccount) {
  throw new Error("Stratégie introuvable");
}
```

---

## 📚 Ressources

- **IDL Complet**: `deployed-idl.json`
- **Program ID**: `BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az`
- **Network**: Solana Devnet
- **Endpoint RPC**: `https://api.devnet.solana.com`

### Scripts d'Exemple
- `scripts/simple-interact.ts` - Script d'interaction CLI
- `scripts/deployed-interact.ts` - Interaction avec contrat déployé

---

## 🤝 Support

Pour toute question d'intégration:
1. Vérifier que le Program ID est correct
2. S'assurer d'être connecté à Devnet
3. Valider que l'IDL est à jour
4. Tester avec les scripts fournis

---

**Status**: ✅ Prêt pour l'intégration  
**Dernière mise à jour**: 2024  
**Version du Protocole**: 1.0 