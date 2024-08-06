import { TransactionRequest } from 'ethers';
import { TokenDescription } from '~types';
import { BASE_DECIMALS, BOOST_DECIMALS } from './numbers';

export const CONTRACT_NAME = 'Pro-rata';
export const CONTRACT_VERSION = '3.3.1';
export const LINEAR_BOOST_FACTOR = 5;

export const TX_OVERRIDES: TransactionRequest = {
  // gasPrice: 3_000_000_000,
  // gasLimit: 1_000_000,
};

export enum Token {
  tUSDT2 = '0xCC2d63ff928996Ad8CdE064c80A1348f6809e043',
  tSQR2 = '0x8364a68c32E581332b962D88CdC8dBe8b3e0EE9c',
  USDT = '0x55d398326f99059fF775485246999027B3197955',
  SQR = '0x2B72867c32CF673F7b02d208B26889fEd353B1f8',
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
  [Token.SQR]: {
    tokenName: 'SQR',
    decimals: BOOST_DECIMALS,
  },
};
