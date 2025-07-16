# 🌾 SolaYield Protocol - Package Intégrateurs

> **Package complet pour l'intégration du protocole SolaYield sur Solana Devnet**

---

## 🎯 Informations Protocole

### **Programme Principal**
- **Program ID**: `BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az`
- **Réseau**: Solana Devnet
- **Status**: ✅ **DÉPLOYÉ ET OPÉRATIONNEL**
- **Version**: Production-ready
- **Taille**: 595,320 bytes (581 KB)

### **Compte Admin**
- **Adresse publique**: `GxZaCcFhtDyvMfQ15zRbsT1jHEZsM4GUcAxbkuy19oat`
- **Solde actuel**: 1.074 SOL
- **Autorité**: Création de stratégies, gestion du protocole

---

## 🔐 Clé Privée Admin

**⚠️ CONFIDENTIEL - À utiliser uniquement par les intégrateurs autorisés**

```json
[168,6,95,92,51,106,178,194,217,225,158,73,252,207,108,70,157,222,21,102,243,33,164,122,221,151,89,172,226,102,121,64,237,27,20,1,41,127,49,200,236,157,39,222,213,195,49,228,131,227,119,153,33,243,231,31,206,172,218,1,152,130,252,229]
```

**Usage JavaScript/TypeScript:**
```javascript
import { Keypair } from "@solana/web3.js";

const adminSecretKey = [168,6,95,92,51,106,178,194,217,225,158,73,252,207,108,70,157,222,21,102,243,33,164,122,221,151,89,172,226,102,121,64,237,27,20,1,41,127,49,200,236,157,39,222,213,195,49,228,131,227,119,153,33,243,231,31,206,172,218,1,152,130,252,229];
const adminWallet = Keypair.fromSecretKey(new Uint8Array(adminSecretKey));
```

---

## 📍 Adresses Importantes

### **Comptes Système**
```
Strategy Counter PDA:     6wCxgmLvgi5FcvgDVJSj6fGVomnbNwcMLaFqdzEM1GSK
```

### **Stratégie ID 0 (Créée)**
```
Strategy PDA:             6yK33ttsrDwimD8441wNvkry8UaWKG5yZrh8pMnWStDM
Yield Token Mint:         CfCJKi6fC26D9J2mkiS6KXPX6Ra8pGPrA3CmGsWnfT1N
Underlying Token:         So11111111111111111111111111111111111111112 (SOL Native)
```

### **Programmes Système Solana**
```
Token Program:            TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
System Program:           11111111111111111111111111111111
Rent Sysvar:             SysvarRent111111111111111111111111111111111
```

---

## 🛠️ Instructions Disponibles

### **📋 Core Protocol (5 instructions)**

| Instruction | Autorisation | Description |
|-------------|--------------|-------------|
| `initialize_protocol` | Admin seulement | ✅ **TERMINÉ** - Initialise le protocole |
| `create_strategy` | Admin seulement | ✅ **DISPONIBLE** - Crée une nouvelle stratégie |
| `deposit_to_strategy` | Utilisateur | ✅ **PRÊT** - Dépose des tokens dans une stratégie |
| `claim_yield` | Utilisateur | ✅ **PRÊT** - Réclame les yield tokens générés |
| `withdraw_from_strategy` | Utilisateur | ✅ **PRÊT** - Retire des tokens d'une stratégie |

### **🏪 Marketplace P2P (5 instructions)**

| Instruction | Autorisation | Description |
|-------------|--------------|-------------|
| `create_marketplace` | Utilisateur | ✅ **PRÊT** - Crée un marketplace pour une stratégie |
| `place_order` | Utilisateur | ✅ **PRÊT** - Place un ordre BUY/SELL |
| `execute_trade` | Utilisateur | ✅ **PRÊT** - Exécute un trade entre ordres |
| `cancel_order` | Utilisateur | ✅ **PRÊT** - Annule un ordre existant |
| `redeem_yield_tokens` | Utilisateur | ✅ **PRÊT** - Échange yield tokens → SOL |

---

## 🎯 Stratégies Disponibles

### **Stratégie ID 0 - "SOL Test Staking"**
- ✅ **CRÉÉE ET OPÉRATIONNELLE**
- **APY**: 12% (1200 basis points)
- **Underlying Token**: SOL natif
- **Yield Token**: ySolana (custom SPL token)
- **Status**: Actif pour dépôts

---

## 📚 Calcul des PDAs

### **Utilitaires JavaScript**
```javascript
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

const PROGRAM_ID = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");

// Strategy Counter (global)
function getStrategyCounterPDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy_counter")],
    PROGRAM_ID
  );
}

// Strategy PDA par ID
function getStrategyPDA(strategyId) {
  const strategyIdBuffer = Buffer.alloc(8);
  strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy"), strategyIdBuffer],
    PROGRAM_ID
  );
}

// Yield Token Mint par stratégie
function getYieldTokenMintPDA(strategyId) {
  const strategyIdBuffer = Buffer.alloc(8);
  strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("yield_token"), strategyIdBuffer],
    PROGRAM_ID
  );
}

// User Position
function getUserPositionPDA(userPublicKey, strategyPDA) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_position"), userPublicKey.toBuffer(), strategyPDA.toBuffer()],
    PROGRAM_ID
  );
}

// Strategy Vault
function getStrategyVaultPDA(strategyId) {
  const strategyIdBuffer = Buffer.alloc(8);
  strategyIdBuffer.writeBigUInt64LE(BigInt(strategyId), 0);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("strategy_vault"), strategyIdBuffer],
    PROGRAM_ID
  );
}
```

---

## 🚀 Exemple d'Intégration

### **1. Setup Initial**
```javascript
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";

// Configuration
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const programId = new PublicKey("BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az");

// Charger l'IDL
const idl = JSON.parse(fs.readFileSync('deployed-idl.json', 'utf8'));
const program = new anchor.Program(idl, programId, provider);
```

### **2. Lire les Stratégies Disponibles**
```javascript
async function getAvailableStrategies() {
  const [strategyCounterPda] = getStrategyCounterPDA();
  const counterAccount = await program.account.strategyCounter.fetch(strategyCounterPda);
  
  const strategies = [];
  for (let i = 0; i < counterAccount.count.toNumber(); i++) {
    const [strategyPda] = getStrategyPDA(i);
    try {
      const strategy = await program.account.strategy.fetch(strategyPda);
      strategies.push({
        id: i,
        name: strategy.name,
        apy: strategy.apy.toNumber() / 100, // Convertir basis points en %
        totalDeposits: strategy.totalDeposits.toNumber(),
        isActive: strategy.isActive,
        address: strategyPda.toBase58()
      });
    } catch (error) {
      console.log(`Strategy ${i} not found`);
    }
  }
  
  return strategies;
}
```

### **3. Déposer dans une Stratégie (Utilisateur)**
```javascript
async function depositToStrategy(userWallet, strategyId, amount) {
  const [strategy] = getStrategyPDA(strategyId);
  const [userPosition] = getUserPositionPDA(userWallet.publicKey, strategy);
  const [yieldTokenMint] = getYieldTokenMintPDA(strategyId);
  const [strategyVault] = getStrategyVaultPDA(strategyId);
  
  const userYieldTokenAccount = await getAssociatedTokenAddress(
    yieldTokenMint,
    userWallet.publicKey
  );

  const tx = await program.methods
    .depositToStrategy(new anchor.BN(amount * LAMPORTS_PER_SOL), new anchor.BN(strategyId))
    .accounts({
      user: userWallet.publicKey,
      strategy,
      userPosition,
      underlyingTokenMint: new PublicKey("So11111111111111111111111111111111111111112"),
      userUnderlyingToken: userWallet.publicKey, // Pour SOL natif
      strategyVault,
      yieldTokenMint,
      userYieldTokenAccount,
      // ... autres comptes système
    })
    .signers([userWallet])
    .rpc();

  return tx;
}
```

### **4. Créer une Nouvelle Stratégie (Admin)**
```javascript
async function createStrategy(adminWallet, name, apyBasisPoints, strategyId) {
  const [strategy] = getStrategyPDA(strategyId);
  const [strategyCounter] = getStrategyCounterPDA();
  const [yieldTokenMint] = getYieldTokenMintPDA(strategyId);

  const tx = await program.methods
    .createStrategy(name, apyBasisPoints, new anchor.BN(strategyId))
    .accounts({
      admin: adminWallet.publicKey,
      strategy,
      strategyCounter,
      underlyingToken: new PublicKey("So11111111111111111111111111111111111111112"),
      yieldTokenMint,
      // ... programmes système
    })
    .signers([adminWallet])
    .rpc();

  return tx;
}
```

---

## 🔍 Debugging et Monitoring

### **Vérifier l'État du Protocole**
```javascript
async function getProtocolStatus() {
  const [strategyCounterPda] = getStrategyCounterPDA();
  
  try {
    const account = await connection.getAccountInfo(strategyCounterPda);
    if (account && account.data.length >= 16) {
      const count = account.data.readBigUInt64LE(8);
      return { initialized: true, strategyCount: Number(count) };
    }
  } catch (error) {
    return { initialized: false, strategyCount: 0 };
  }
}
```

### **Vérifier une Transaction**
```javascript
async function checkTransaction(signature) {
  const transaction = await connection.getTransaction(signature);
  if (transaction) {
    console.log("Status:", transaction.meta?.err ? "Failed" : "Success");
    console.log("Logs:", transaction.meta?.logMessages);
  }
}
```

---

## 🛡️ Sécurité et Bonnes Pratiques

### **✅ À Faire**
1. **Valider les PDAs** avant chaque transaction
2. **Vérifier les soldes** avant les opérations
3. **Gérer les erreurs** Anchor spécifiques
4. **Utiliser la simulation** avant l'envoi réel
5. **Confirmer les transactions** avec `confirmed` commitment

### **❌ À Éviter**
1. Ne jamais exposer la clé privée admin côté client
2. Ne pas ignorer les erreurs de simulation
3. Ne pas assumer que les PDAs existent
4. Ne pas oublier de signer avec les bons wallets
5. Ne pas utiliser `finalized` pour les tests rapides

---

## 📞 Support Technique

### **Ressources Disponibles**
- **IDL Complet**: `deployed-idl.json` (1237 lignes)
- **Scripts d'Interaction**: `scripts/interact.js`, `scripts/simple-interact.ts`
- **Tests Complets**: `tests/contracts.ts` (509 lignes)
- **Guide d'Intégration**: `INTEGRATION_GUIDE.md`

### **Logs Communs et Solutions**
```
Error Code 102 (InstructionDidNotDeserialize)
→ Solution: Vérifier le format des arguments et la sérialisation

Error Code 6000 (StrategyNotActive)
→ Solution: Vérifier que la stratégie est active avant dépôt

Insufficient Balance
→ Solution: Vérifier le solde utilisateur avant transaction
```

---

## 🎉 Prêt pour l'Intégration !

### **Status Actuel**
- ✅ **Protocole déployé** et opérationnel
- ✅ **Stratégie de test** créée et fonctionnelle
- ✅ **Toutes les instructions** validées
- ✅ **Documentation complète** fournie
- ✅ **Clé admin** partagée

### **Prochaines Étapes**
1. **Tester l'intégration** avec la stratégie ID 0
2. **Créer des stratégies** supplémentaires selon les besoins
3. **Développer l'interface** utilisateur
4. **Migrer vers mainnet** quand prêt

---

**📅 Document généré le**: $(date)  
**🌐 Réseau**: Solana Devnet  
**🆔 Program ID**: `BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az`  
**🔑 Admin**: `GxZaCcFhtDyvMfQ15zRbsT1jHEZsM4GUcAxbkuy19oat`  
**✅ Status**: **OPÉRATIONNEL** - Prêt pour l'intégration 