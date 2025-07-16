export type SolaYield = {
  "version": "0.1.0",
  "name": "contracts",
  "instructions": [
    {
      "name": "cancelOrder",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marketplace",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "order",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimYield",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "strategyId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createMarketplace",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketplace",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketplaceCounter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "strategyId",
          "type": "u64"
        },
        {
          "name": "marketplaceId",
          "type": "u64"
        },
        {
          "name": "tradingFeeBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "createStrategy",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyCounter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "underlyingToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yieldTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "apyBasisPoints",
          "type": "u16"
        },
        {
          "name": "strategyId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositToStrategy",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yieldTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userUnderlyingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userYieldAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "strategyId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeTrade",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "seller",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketplace",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "order",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "yieldTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerYieldAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerUnderlyingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerUnderlyingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tradeAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeProtocol",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategyCounter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "placeOrder",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marketplace",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "order",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orderCounter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "yieldTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "u64"
        },
        {
          "name": "orderType",
          "type": "u8"
        },
        {
          "name": "yieldTokenAmount",
          "type": "u64"
        },
        {
          "name": "pricePerToken",
          "type": "u64"
        }
      ]
    },
    {
      "name": "redeemYieldTokens",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yieldTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userUnderlyingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userYieldAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "yieldTokenAmount",
          "type": "u64"
        },
        {
          "name": "strategyId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawFromStrategy",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "strategyId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "marketplace",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "strategy",
            "type": "publicKey"
          },
          {
            "name": "yieldTokenMint",
            "type": "publicKey"
          },
          {
            "name": "underlyingTokenMint",
            "type": "publicKey"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "totalTrades",
            "type": "u64"
          },
          {
            "name": "bestBidPrice",
            "type": "u64"
          },
          {
            "name": "bestAskPrice",
            "type": "u64"
          },
          {
            "name": "tradingFeeBps",
            "type": "u16"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "marketplaceId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "strategy",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "underlyingToken",
            "type": "publicKey"
          },
          {
            "name": "yieldTokenMint",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "apy",
            "type": "u64"
          },
          {
            "name": "totalDeposits",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "totalYieldTokensMinted",
            "type": "u64"
          },
          {
            "name": "strategyId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userPosition",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "strategy",
            "type": "publicKey"
          },
          {
            "name": "depositedAmount",
            "type": "u64"
          },
          {
            "name": "yieldTokensMinted",
            "type": "u64"
          },
          {
            "name": "depositTime",
            "type": "i64"
          },
          {
            "name": "lastYieldClaim",
            "type": "i64"
          },
          {
            "name": "totalYieldClaimed",
            "type": "u64"
          },
          {
            "name": "positionId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "tradeOrder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "marketplace",
            "type": "publicKey"
          },
          {
            "name": "orderType",
            "type": "u8"
          },
          {
            "name": "yieldTokenAmount",
            "type": "u64"
          },
          {
            "name": "pricePerToken",
            "type": "u64"
          },
          {
            "name": "totalValue",
            "type": "u64"
          },
          {
            "name": "filledAmount",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "orderId",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "StrategyNotActive",
      "msg": "Strategy is not active"
    },
    {
      "code": 6001,
      "name": "UnauthorizedUser",
      "msg": "Unauthorized user for this position"
    },
    {
      "code": 6002,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6003,
      "name": "InvalidAmount",
      "msg": "Invalid withdrawal amount"
    }
  ]
};

export const IDL: SolaYield = {
  "version": "0.1.0",
  "name": "contracts",
  "instructions": [
    {
      "name": "cancelOrder",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marketplace",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "order",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimYield",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "strategyId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createMarketplace",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketplace",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "marketplaceCounter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "strategyId",
          "type": "u64"
        },
        {
          "name": "marketplaceId",
          "type": "u64"
        },
        {
          "name": "tradingFeeBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "createStrategy",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyCounter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "underlyingToken",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yieldTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "apyBasisPoints",
          "type": "u16"
        },
        {
          "name": "strategyId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositToStrategy",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yieldTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userUnderlyingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userYieldAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "strategyId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeTrade",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "seller",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "marketplace",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "order",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "yieldTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerYieldAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerUnderlyingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerUnderlyingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tradeAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeProtocol",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategyCounter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "placeOrder",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "marketplace",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "order",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "orderCounter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "yieldTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "u64"
        },
        {
          "name": "orderType",
          "type": "u8"
        },
        {
          "name": "yieldTokenAmount",
          "type": "u64"
        },
        {
          "name": "pricePerToken",
          "type": "u64"
        }
      ]
    },
    {
      "name": "redeemYieldTokens",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yieldTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userUnderlyingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userYieldAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "yieldTokenAmount",
          "type": "u64"
        },
        {
          "name": "strategyId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawFromStrategy",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "underlyingTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "strategyId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "marketplace",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "strategy",
            "type": "publicKey"
          },
          {
            "name": "yieldTokenMint",
            "type": "publicKey"
          },
          {
            "name": "underlyingTokenMint",
            "type": "publicKey"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "totalTrades",
            "type": "u64"
          },
          {
            "name": "bestBidPrice",
            "type": "u64"
          },
          {
            "name": "bestAskPrice",
            "type": "u64"
          },
          {
            "name": "tradingFeeBps",
            "type": "u16"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "marketplaceId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "strategy",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "underlyingToken",
            "type": "publicKey"
          },
          {
            "name": "yieldTokenMint",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "apy",
            "type": "u64"
          },
          {
            "name": "totalDeposits",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "totalYieldTokensMinted",
            "type": "u64"
          },
          {
            "name": "strategyId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userPosition",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "strategy",
            "type": "publicKey"
          },
          {
            "name": "depositedAmount",
            "type": "u64"
          },
          {
            "name": "yieldTokensMinted",
            "type": "u64"
          },
          {
            "name": "depositTime",
            "type": "i64"
          },
          {
            "name": "lastYieldClaim",
            "type": "i64"
          },
          {
            "name": "totalYieldClaimed",
            "type": "u64"
          },
          {
            "name": "positionId",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "tradeOrder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "marketplace",
            "type": "publicKey"
          },
          {
            "name": "orderType",
            "type": "u8"
          },
          {
            "name": "yieldTokenAmount",
            "type": "u64"
          },
          {
            "name": "pricePerToken",
            "type": "u64"
          },
          {
            "name": "totalValue",
            "type": "u64"
          },
          {
            "name": "filledAmount",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "orderId",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "StrategyNotActive",
      "msg": "Strategy is not active"
    },
    {
      "code": 6001,
      "name": "UnauthorizedUser",
      "msg": "Unauthorized user for this position"
    },
    {
      "code": 6002,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6003,
      "name": "InvalidAmount",
      "msg": "Invalid withdrawal amount"
    }
  ]
}; 