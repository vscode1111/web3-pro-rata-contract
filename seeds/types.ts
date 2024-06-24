import { BigNumberish } from 'ethers';

export interface ContractConfig {
  newOwner: string;
  baseToken: string;
  boostToken: string;
  verifier: string;
  baseGoal: bigint;
  startDate: number;
  closeDate: number;
}

export type DeployContractArgs = [
  newOwner: string,
  baseToken: string,
  boostToken: string,
  verifier: string,
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
  decimals_: bigint | number,
];
