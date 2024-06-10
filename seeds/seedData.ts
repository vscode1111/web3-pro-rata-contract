import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { toUnixTime, toUnixTimeUtc, toWei } from '~common';
import { MINUTES, Token } from '~constants';
import { DeployNetworkKey, TokenAddressDescription } from '~types';
import { addSecondsToUnixTime } from '~utils';
import { getTokenDescription } from '~utils/contracts';
import { defaultNetwork } from '../hardhat.config';
import { ContractConfig, DeployContractArgs, DeployTokenArgs, TokenConfig } from './types';

type DeployType = 'test' | 'main' | 'stage' | 'prod';

const deployType: DeployType = (process.env.ENV as DeployType) ?? 'main';

const isSqr = ['test', 'main'].includes(deployType);
// const isSqr = false;

const isProd = deployType === ('prod' as any);
if (isProd) {
  throw 'Are you sure? It is PROD!';
}

export const chainTokenDescription: Record<DeployNetworkKey, TokenAddressDescription> = {
  bsc: isSqr ? getTokenDescription(Token.tSQR) : getTokenDescription(Token.USDT), //SQR/USDT
};

export const { address: tokenAddress, decimals: tokenDecimals } =
  chainTokenDescription[defaultNetwork];

const priceDiv = BigInt(1);
const userDiv = BigInt(3);
export const now = dayjs();

export const contractConfigDeployMap: Record<DeployType, Partial<ContractConfig>> = {
  test: {
    newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
    baseToken: tokenAddress,
    verifier: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
    goal: toWei(1_200, tokenDecimals) / priceDiv,
    startDate: toUnixTime(now.add(1, 'days').toDate()),
    closeDate: toUnixTime(now.add(2, 'days').toDate()),
  },
  main: {
    newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF', //My s-owner2
    verifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
    goal: toWei(1_000, tokenDecimals),
    startDate: 0,
    // startDate: toUnixTime(new Date(2024, 4, 17, 9, 0, 0)),
    // closeDate: 0,
    closeDate: toUnixTimeUtc(new Date(2024, 5, 10, 9, 58, 0)),
  },
  stage: {
    newOwner: '0xA8B8455ad9a1FAb1d4a3B69eD30A52fBA82549Bb', //Matan
    verifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
    goal: toWei(15, tokenDecimals),
    // startDate: 0,
    startDate: toUnixTime(new Date(2024, 4, 27, 19, 0, 0)),
    // closeDate: 0,
    closeDate: toUnixTime(new Date(2026, 4, 28, 23, 0, 0)),
  },
  prod: {
    newOwner: '0xA8B8455ad9a1FAb1d4a3B69eD30A52fBA82549Bb', //Matan
    verifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
    goal: toWei(15, tokenDecimals),
    // startDate: 0,
    startDate: toUnixTimeUtc(new Date(2024, 4, 27, 16, 0, 0)),
    // closeDate: 0,
    closeDate: toUnixTimeUtc(new Date(2024, 4, 27, 20, 0, 0)),
  },
};

const extContractConfig = contractConfigDeployMap[deployType];

export const contractConfig: ContractConfig = {
  newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
  baseToken: tokenAddress,
  boostToken: tokenAddress,
  verifier: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
  goal: toWei(1_200, tokenDecimals) / priceDiv,
  startDate: toUnixTime(now.add(1, 'days').toDate()),
  closeDate: toUnixTime(now.add(2, 'days').toDate()),
  ...extContractConfig,
};

export function getContractArgs(contractConfig: ContractConfig): DeployContractArgs {
  const { newOwner, baseToken, boostToken, verifier, goal, startDate, closeDate } = contractConfig;
  return [newOwner, baseToken, boostToken, verifier, goal, startDate, closeDate];
}

export const tokenConfig: TokenConfig = {
  name: 'empty',
  symbol: 'empty',
  newOwner: '0x81aFFCB2FaCEcCaE727Fa4b1B2ef534a1Da67791',
  initMint: toWei(1_000_000_000, tokenDecimals),
  decimals: tokenDecimals,
};

export function getTokenArgs(newOwner: string): DeployTokenArgs {
  return [
    tokenConfig.name,
    tokenConfig.symbol,
    newOwner,
    tokenConfig.initMint,
    tokenConfig.decimals,
  ];
}

const userInitBalance = toWei(100_000, tokenDecimals) / priceDiv;
const deposit1 = toWei(1_000, tokenDecimals) / priceDiv;
const extraDeposit1 = toWei(2_500, tokenDecimals) / priceDiv;

const transactionId1 = uuidv4();
const transactionId1_2 = uuidv4();
const transactionId2 = uuidv4();

export const seedData = {
  zero: toWei(0),
  userInitBalance,
  totalAccountBalance: tokenConfig.initMint,
  deposit1,
  deposit2: deposit1 / userDiv,
  deposit12: deposit1 + deposit1 / userDiv,
  extraDeposit1,
  extraDeposit2: extraDeposit1 / userDiv,
  extraDeposit3: extraDeposit1 / userDiv / userDiv,
  allowance: toWei(1000000, tokenDecimals),
  balanceDelta: toWei(0.000001, tokenDecimals),
  nowPlus1m: toUnixTime(now.add(1, 'minute').toDate()),
  startDatePlus1m: addSecondsToUnixTime(contractConfig.startDate, 1 * MINUTES),
  closeDatePlus1m: addSecondsToUnixTime(contractConfig.closeDate, 1 * MINUTES),
  timeShift: 10,
  batchSize: 1,
  transactionId1,
  transactionId1_2,
  transactionId2,
  transactionIdWrong: 'wrong',
  invalidNonce: 999,
  depositNonce1_0: 0,
  depositNonce1_1: 1,
  depositNonce2_0: 0,
};
