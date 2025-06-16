export interface YieldToken {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: number;
  underlyingAsset: string;
  maturityDate: Date;
  apy: number;
}

export interface MarketListing {
  id: string;
  yieldToken: YieldToken;
  price: number;
  amount: number;
  seller: string;
  createdAt: Date;
}

export interface UserPosition {
  yieldToken: YieldToken;
  amount: number;
  value: number;
  maturityDate: Date;
  apy: number;
}

export interface StakingPool {
  id: string;
  name: string;
  apy: number;
  totalValueLocked: number;
  minimumStake: number;
  token: string;
} 