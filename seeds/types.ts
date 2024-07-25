import { BigNumberish, Numeric } from 'ethers';

export interface BaseContractConfig {
  baseDecimals: number;
  boostDecimals: number;
  depositVerifier: string;
  baseGoal: bigint;
  startDate: number;
  closeDate: number;
  externalRefund: boolean;
  linearAllocation: boolean;
  linearBoostFactor: bigint;
}

export interface ContractConfig extends BaseContractConfig {
  newOwner: string;
  baseToken: string;
  boostToken: string;
}

export type BaseContractConfigEx = BaseContractConfig & Partial<ContractConfig>;

export type DeployContractArgs = [
  {
    newOwner: string;
    baseToken: string;
    baseDecimals: number;
    boostToken: string;
    boostDecimals: number;
    depositVerifier: string;
    baseGoal: BigNumberish;
    startDate: number;
    closeDate: number;
    externalRefund: boolean;
    linearAllocation: boolean;
    linearBoostFactor: BigNumberish;
  },
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
