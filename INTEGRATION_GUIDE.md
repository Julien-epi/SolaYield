# 🔗 Guide d'Intégration SolaYield - Frontend ↔ Smart Contracts

## 📋 Vue d'ensemble

Ce guide explique comment les smart contracts SolaYield ont été connectés au frontend Next.js, et comment utiliser cette intégration.

## 🏗️ Architecture d'Intégration

### 1. **Configuration de Base**

#### Variables d'Environnement (`.env.local`)
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

#### Dépendances Installées
```json
{
  "@coral-xyz/anchor": "^0.31.1",
  "@solana/spl-token": "^0.4.13"
}
```

### 2. **Structure des Services**

```
src/services/
├── program.ts          # Service de connexion au contract principal
├── idl.ts             # Interface Definition Language (IDL)
├── staking.ts         # Service pour les stratégies de yield farming
└── marketplace.ts     # Service pour le trading de yield tokens
```

### 3. **Hook React Personnalisé**

```
src/hooks/
└── useSolaYield.ts    # Hook pour gérer l'état et les interactions
```

## 🔧 Services Principaux

### **Program Service** (`program.ts`)

Service singleton pour gérer la connexion au smart contract :

```typescript
import { solaYieldProgram, SolaYieldProgram } from './services/program';

// Initialiser la connexion
await solaYieldProgram.initializeProgram(wallet);

// Utiliser les utilitaires PDA
const [strategyPDA] = SolaYieldProgram.findStrategyPDA(strategyId);
```

**Fonctionnalités :**
- ✅ Connexion automatique au bon cluster (devnet/mainnet)
- ✅ Gestion des PDAs (Program Derived Addresses)
- ✅ Pattern Singleton pour la réutilisation
- ✅ Configuration centralisée

### **Staking Service** (`staking.ts`)

Service pour les opérations de yield farming :

```typescript
import { stakingService } from './services/staking';

// Récupérer les stratégies
const strategies = await stakingService.getStrategies();

// Déposer dans une stratégie
const txHash = await stakingService.depositToStrategy(wallet, strategyId, amount);

// Réclamer les rewards
const txHash = await stakingService.claimYield(wallet, strategyId);
```

**Instructions disponibles :**
- ✅ `getStrategies()` - Récupérer toutes les stratégies
- ✅ `getUserPositions()` - Positions de l'utilisateur
- ✅ `depositToStrategy()` - Déposer des tokens
- ✅ `claimYield()` - Réclamer les rewards
- ✅ `withdrawFromStrategy()` - Retirer le capital

### **Marketplace Service** (`marketplace.ts`)

Service pour le trading de yield tokens :

```typescript
import { marketplaceService } from './services/marketplace';

// Placer un ordre
const txHash = await marketplaceService.placeOrder(
  wallet, marketplaceId, strategyId, 'buy', amount, price
);

// Exécuter un trade
const txHash = await marketplaceService.executeTrade(
  wallet, orderId, amount, sellerPublicKey
);
```

**Instructions disponibles :**
- ✅ `getMarketplaces()` - Récupérer les marketplaces
- ✅ `getOrders()` - Ordres d'un marketplace
- ✅ `placeOrder()` - Placer un ordre buy/sell
- ✅ `executeTrade()` - Exécuter un trade
- ✅ `cancelOrder()` - Annuler un ordre

## 🎣 Hook React (`useSolaYield`)

Hook personnalisé qui simplifie l'utilisation dans les composants React :

```typescript
import { useSolaYield } from '../hooks/useSolaYield';

function MyComponent() {
  const {
    // État
    isLoading,
    error,
    isInitialized,
    
    // Données
    strategies,
    userPositions,
    marketplaces,
    
    // Actions
    depositToStrategy,
    claimYield,
    placeOrder,
    refresh
  } = useSolaYield();

  // Le hook gère automatiquement :
  // - L'initialisation quand le wallet se connecte
  // - Le chargement des données
  // - La gestion des erreurs
  // - Le rechargement après les transactions
}
```

**Avantages du Hook :**
- 🔄 **Auto-initialisation** quand le wallet se connecte
- 📊 **Gestion d'état** centralisée
- ⚡ **Rechargement automatique** des données après transactions
- 🚨 **Gestion d'erreurs** unifiée
- 🔄 **Loading states** intégrés

## 💡 Exemple d'Utilisation

### Composant Simple pour Déposer

```typescript
import React, { useState } from 'react';
import { useSolaYield } from '../hooks/useSolaYield';

export const DepositComponent: React.FC = () => {
  const { strategies, depositToStrategy, isLoading } = useSolaYield();
  const [amount, setAmount] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);

  const handleDeposit = async () => {
    if (!selectedStrategy || !amount) return;
    
    try {
      const tx = await depositToStrategy(selectedStrategy, parseFloat(amount));
      alert(`Dépôt réussi! Transaction: ${tx}`);
      setAmount('');
    } catch (error) {
      alert(`Erreur: ${error}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Déposer dans une stratégie</h3>
      
      {/* Sélection de stratégie */}
      <select 
        value={selectedStrategy || ''} 
        onChange={(e) => setSelectedStrategy(Number(e.target.value))}
        className="w-full p-2 mb-4 border rounded"
      >
        <option value="">Choisir une stratégie</option>
        {strategies.map(strategy => (
          <option key={strategy.id} value={strategy.strategyId}>
            {strategy.name} - {strategy.apy}% APY
          </option>
        ))}
      </select>

      {/* Montant */}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Montant à déposer"
        className="w-full p-2 mb-4 border rounded"
      />

      {/* Bouton de dépôt */}
      <button
        onClick={handleDeposit}
        disabled={isLoading || !selectedStrategy || !amount}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Transaction en cours...' : 'Déposer'}
      </button>
    </div>
  );
};
```

## 🔐 Gestion des Erreurs

### Types d'Erreurs Communes

1. **Wallet non connecté**
```typescript
// Le hook gère automatiquement cette erreur
if (!isInitialized) {
  return <div>Connectez votre wallet pour commencer</div>;
}
```

2. **Erreurs de transaction**
```typescript
try {
  const tx = await depositToStrategy(strategyId, amount);
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    setError('Solde insuffisant');
  } else if (error.message.includes('Strategy not active')) {
    setError('Stratégie inactive');
  } else {
    setError('Erreur de transaction');
  }
}
```

3. **Erreurs de comptes**
```typescript
// Les services gèrent automatiquement la création des comptes associés
// Si un compte n'existe pas, il sera créé dans la transaction
```

## 🚀 Déploiement et Configuration

### Pour Devnet
```bash
# Variables d'environnement
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=BCz6K4XSaycH954PhZPPmwuistSyJP5p5Biya7frA2Az

# Installer les dépendances
cd solayield-app
npm install @coral-xyz/anchor @solana/spl-token

# Lancer l'application
npm run dev
```

### Pour Mainnet
```bash
# Variables d'environnement
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_PROGRAM_ID=<PROGRAM_ID_MAINNET>
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
```

## 📊 Monitoring et Debug

### Logs de Transaction
```typescript
// Tous les services loggent automatiquement les erreurs
console.log('Transaction hash:', txHash);
console.error('Transaction failed:', error);
```

### Solana Explorer
```typescript
// Les hash de transaction peuvent être vérifiés sur Solana Explorer
const explorerUrl = `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
```

### Debug Mode
```typescript
// Pour débugger, activez les logs détaillés
localStorage.setItem('debug', 'solayield:*');
```

## 🔄 Workflow de Développement

### 1. Modifier les Smart Contracts
```bash
# Dans le dossier racine
anchor build
anchor deploy --provider.cluster devnet
```

### 2. Mettre à jour l'IDL
```bash
# Copier le nouvel IDL
cp target/idl/contracts.json solayield-app/src/services/deployed-idl.json

# Mettre à jour idl.ts si nécessaire
```

### 3. Tester les Modifications
```bash
# Lancer les tests
anchor test

# Tester le frontend
cd solayield-app && npm run dev
```

## 🛡️ Sécurité

### Validation des Entrées
```typescript
// Tous les montants sont validés
if (amount <= 0) throw new Error('Montant invalide');
if (amount > maxAmount) throw new Error('Montant trop élevé');
```

### Gestion des PDAs
```typescript
// Les PDAs sont calculées côté client pour éviter les erreurs
const [pda] = SolaYieldProgram.findStrategyPDA(strategyId);
```

### Rate Limiting
```typescript
// Éviter les spams de transactions
const [isSubmitting, setIsSubmitting] = useState(false);
if (isSubmitting) return;
```

## 📚 Ressources Supplémentaires

- **Documentation Anchor** : https://book.anchor-lang.com/
- **Solana Cookbook** : https://solanacookbook.com/
- **Wallet Adapter** : https://github.com/solana-labs/wallet-adapter
- **SPL Token Docs** : https://spl.solana.com/token

## 🐛 Troubleshooting

### Erreurs Communes

1. **"Program not found"**
   - Vérifier le PROGRAM_ID dans `.env.local`
   - S'assurer que le contract est déployé sur le bon cluster

2. **"Account not found"**
   - Le compte sera créé automatiquement lors de la première transaction
   - Vérifier que l'utilisateur a assez de SOL pour les frais

3. **"Insufficient funds"**
   - L'utilisateur n'a pas assez de tokens pour la transaction
   - Inclure les frais de transaction dans le calcul

4. **"Wallet not connected"**
   - S'assurer que le wallet est connecté avant d'initialiser
   - Utiliser le hook `useWallet` pour vérifier l'état

---

## ✅ **Intégration Complète Réussie !**

Le protocole SolaYield est maintenant entièrement connecté au frontend avec :

- 🔗 **Connexion directe** aux smart contracts Solana
- 🎯 **Interface utilisateur** intuitive et réactive  
- 🔄 **Gestion d'état** automatique et optimisée
- 🚨 **Gestion d'erreurs** robuste
- 📊 **Monitoring** et debugging intégrés
- 🛡️ **Sécurité** et validation des données

Les utilisateurs peuvent maintenant interagir directement avec les contracts pour déposer, trader, et gérer leurs yield tokens en toute sécurité ! 