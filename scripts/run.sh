#!/bin/bash

# Script wrapper pour SolaYield CLI
# Définit automatiquement ANCHOR_WALLET et lance les commandes

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌾 SolaYield CLI Wrapper${NC}"

# Vérifier si le wallet existe
WALLET_PATH="$HOME/.config/solana/devnet.json"
DEFAULT_WALLET_PATH="$HOME/.config/solana/id.json"

if [ -f "$WALLET_PATH" ]; then
    export ANCHOR_WALLET="$WALLET_PATH"
    echo -e "${GREEN}✅ Using devnet wallet: $WALLET_PATH${NC}"
elif [ -f "$DEFAULT_WALLET_PATH" ]; then
    export ANCHOR_WALLET="$DEFAULT_WALLET_PATH"
    echo -e "${GREEN}✅ Using default wallet: $DEFAULT_WALLET_PATH${NC}"
else
    echo -e "${RED}❌ No wallet found!${NC}"
    echo -e "${YELLOW}Creating a new devnet wallet...${NC}"
    
    # Créer le répertoire s'il n'existe pas
    mkdir -p "$HOME/.config/solana"
    
    # Créer un nouveau wallet
    solana-keygen new --outfile "$WALLET_PATH" --no-bip39-passphrase
    
    if [ $? -eq 0 ]; then
        export ANCHOR_WALLET="$WALLET_PATH"
        echo -e "${GREEN}✅ New wallet created: $WALLET_PATH${NC}"
        
        # Configurer Solana pour utiliser ce wallet
        solana config set --keypair "$WALLET_PATH"
        solana config set --url devnet
        
        echo -e "${YELLOW}💰 Getting devnet SOL for testing...${NC}"
        solana airdrop 2
    else
        echo -e "${RED}❌ Failed to create wallet${NC}"
        exit 1
    fi
fi

# Vérifier le solde
echo -e "${BLUE}💰 Current wallet balance:${NC}"
solana balance

BALANCE=$(solana balance --lamports | grep -o '[0-9]*')
if [ -n "$BALANCE" ] && [ "$BALANCE" -lt 100000000 ]; then  # Moins de 0.1 SOL
    echo -e "${YELLOW}⚠️  Low balance detected, requesting airdrop...${NC}"
    solana airdrop 2
fi

echo -e "${BLUE}🚀 Running SolaYield command...${NC}"
echo ""

# Lancer la commande avec les arguments passés
yarn ts-node scripts/simple-interact.ts "$@" 