import { BigNumberish, Numeric } from 'ethers';

export interface ContractConfig {
  newOwner: string;
  baseToken: string;
  baseDecimals: number;
  boostToken: string;
  boostDecimals: number;
  depositVerifier: string;
  baseGoal: bigint;
  startDate: number;
  closeDate: number;
}

export type DeployContractArgs = [
  newOwner: string,
  baseToken: string,
  baseDecimals: number,
  boostToken: string,
  boostDecimals: number,
  depositVerifier: string,
  baseGoal: BigNumberish,
  startDate: number,
  closeDate: number,
];

export interface TokenConfig {
  name: string;
  symbol: string;
  newOwner: string;
  initMint: bigint;
  decimals: number;
}

export type DeployTokenArgs = [
  name_: string,
  symbol_: string,
  newOwner: string,
  initMint: bigint,
  decimals_: Numeric,
];
