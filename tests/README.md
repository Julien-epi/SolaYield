# Tests Unitaires SolaYield

Ce dossier contient les tests unitaires complets pour le smart contract SolaYield développé avec Anchor.

## 🧪 Structure des Tests

### Fonctionnalités testées

1. **Deposit Functionality**
   - ✅ Dépôt réussi avec validation d'état
   - ✅ Protection contre les dépôts multiples du même utilisateur
   - ✅ Support multi-utilisateurs
   - ✅ Gestion des montants zéro
   - ✅ Test avec des montants élevés

2. **Redeem Functionality** 
   - ✅ Échec de retrait avant maturité (60 secondes)
   - ✅ Protection contre les utilisateurs non autorisés
   - ✅ Retrait réussi après maturité
   - ✅ Protection contre les retraits multiples
   - ✅ Fermeture correcte des comptes

3. **State Validation**
   - ✅ Validation de l'état du pool à travers les opérations
   - ✅ Vérification des montants et timestamps
   - ✅ Validation de la propriété des comptes

4. **Edge Cases**
   - ✅ Validation des timestamps
   - ✅ Gestion des cas limites
   - ✅ Tests de robustesse

## 🚀 Comment lancer les tests

### Prérequis
```bash
# Installer les dépendances
yarn install

# Construire le projet
yarn build
```

### Exécution des tests

#### 1. Tests complets avec validateur local
```bash
# Lance un validateur local et exécute tous les tests
yarn test
# ou
anchor test
```

#### 2. Validation de la syntaxe uniquement
```bash
# Vérifie la compilation TypeScript
yarn test:syntax
```

#### 3. Tests unitaires (nécessite un validateur externe)
```bash
# Si vous avez un validateur Solana qui tourne
yarn test:unit
```

### Configuration du Validateur Local

Si vous voulez lancer les tests avec un validateur local séparé :

```bash
# Terminal 1 - Démarrer le validateur
solana-test-validator

# Terminal 2 - Lancer les tests
yarn test:unit
```

## 📊 Couverture des Tests

Les tests couvrent :

- **Instructions** : `deposit()`, `redeem()`
- **Accounts** : `Pool`, `UserPosition`
- **PDAs** : Pool, UserPosition, YTMint
- **Erreurs** : `NotMature`, contraintes d'autorisation
- **États** : Validation des montants, timestamps, fermeture de comptes

## 🔧 Configuration

### Anchor.toml
```toml
[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### Dépendances requises
- `@coral-xyz/anchor`: Framework Solana
- `@solana/spl-token`: Gestion des tokens SPL
- `chai`: Assertions de test
- `ts-mocha`: Test runner TypeScript

## 🐛 Dépannage

### Erreur "Connection refused"
- Assurez-vous qu'un validateur Solana est en cours d'exécution
- Utilisez `anchor test` pour un validateur automatique
- Ou démarrez manuellement avec `solana-test-validator`

### Erreurs de compilation TypeScript
- Vérifiez que toutes les dépendances sont installées : `yarn install`
- Validez la syntaxe : `yarn test:syntax`

### Timeouts de test
- Les tests incluent une attente de 65 secondes pour la maturité
- Ajustez la timeout dans le script si nécessaire

## 📝 Structure du Code de Test

```typescript
describe("SolaYield Contracts", () => {
  // Configuration et setup
  before(() => { /* Initialisation */ });
  
  describe("Deposit Functionality", () => {
    // Tests de dépôt
  });
  
  describe("Redeem Functionality", () => {
    // Tests de retrait
  });
  
  describe("State Validation", () => {
    // Validation des états
  });
  
  describe("Edge Cases", () => {
    // Cas limites
  });
});
```

## 🎯 Résultats Attendus

Tous les tests doivent passer avec des messages de type :
- ✅ Deposit transaction: [hash]
- ✅ Pool total deposits: [amount]
- ✅ User position amount: [amount]
- ✅ Correctly failed premature redeem
- ✅ Redeem successful. Pool total deposits: [amount]

## 🔍 Debugging

Pour des logs détaillés :
```bash
ANCHOR_LOG=true yarn test
``` 