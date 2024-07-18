import { TransactionRequest } from 'ethers';
import { TokenDescription } from '~types';
import { BASE_DECIMALS, BOOST_DECIMALS } from './numbers';

export const VERSION = '2.6.1';
export const CONTRACT_NAME = 'Pro-rata';

export const TX_OVERRIDES: TransactionRequest = {
  // gasPrice: 3_000_000_000,
  // gasLimit: 1_000_000,
};

export enum Token {
  tUSDT2 = '0xCC2d63ff928996Ad8CdE064c80A1348f6809e043',
  tSQR2 = '0x8364a68c32E581332b962D88CdC8dBe8b3e0EE9c',
  USDT = '0x55d398326f99059fF775485246999027B3197955',
}

export const TOKENS_DESCRIPTIONS: Record<string, TokenDescription> = {
  [Token.tUSDT2]: {
    tokenName: 'tUSDT2',
    decimals: BASE_DECIMALS,
  },
  [Token.tSQR2]: {
    tokenName: 'tSQR2',
    decimals: BOOST_DECIMALS,
  },
  [Token.USDT]: {
    tokenName: 'USDT',
    decimals: BASE_DECIMALS,
  },
};
