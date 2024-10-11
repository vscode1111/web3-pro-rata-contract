import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { MINUTES, toUnixTime, toUnixTimeUtc, toWei } from '~common';
import {
  BASE_DECIMALS,
  BOOST_DECIMALS,
  LINEAR_BOOST_FACTOR,
  MATAN_WALLET,
  Token,
  ZERO,
} from '~constants';
import { DeployNetworkKey, TokenAddressDescription } from '~types';
import { addSecondsToUnixTime } from '~utils';
import { getTokenDescription } from '~utils/contracts';
import { toBaseTokenWei, toBoostTokenWei } from '~utils/converts';
import { defaultNetwork } from '../hardhat.config';
import { ContractConfig, DeployContractArgs, DeployTokenArgs, TokenConfig } from './types';

type DeployType = 'test' | 'main' | 'stage' | 'prod';

const deployType: DeployType = (process.env.ENV as DeployType) ?? 'prod';

const isProd = deployType === ('prod' as any);
// if (isProd) {
//   throw 'Are you sure? It is PROD!';
// }

export const baseChainTokenDescription: Record<DeployNetworkKey, TokenAddressDescription> = {
  bsc: isProd ? getTokenDescription(Token.USDT) : getTokenDescription(Token.tUSDT2), //USDT/tUSDT2
};

export const boostChainTokenDescription: Record<DeployNetworkKey, TokenAddressDescription> = {
  bsc: isProd ? getTokenDescription(Token.WEB3) : getTokenDescription(Token.tWEB32), //WEB3/tWEB32
};

export const { address: baseToken, decimals: baseDecimals } =
  baseChainTokenDescription[defaultNetwork];

export const { address: boostToken, decimals: boostDecimals } =
  boostChainTokenDescription[defaultNetwork];

const priceDiv = BigInt(1);
const userDiv = BigInt(3);
export const now = dayjs();

export const contractConfigDeployMap: Record<DeployType, Partial<ContractConfig>> = {
  test: {
    newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
    baseToken: baseToken,
    // baseDecimals: getTokenDescription(Token.tWEB3).decimals,
    // boostDecimals: getTokenDescription(Token.tWEB3).decimals,
    baseDecimals: BASE_DECIMALS,
    boostDecimals: BOOST_DECIMALS,
    // boostToken: ZeroAddress,
    depositVerifier: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
    baseGoal: toBaseTokenWei(1_200) / priceDiv,
    startDate: toUnixTime(now.add(1, 'days').toDate()),
    closeDate: toUnixTime(now.add(2, 'days').toDate()),
    externalRefund: false,
    linearAllocation: false,
    linearBoostFactor: ZERO,
  },
  main: {
    newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF', //My s-owner2
    depositVerifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
    baseGoal: toBaseTokenWei(10_000),
    startDate: 0,
    // closeDate: 0,
    // closeDate: toUnixTimeUtc(new Date(2025, 6, 8, 8, 40, 0)),
    closeDate: toUnixTime(now.add(2, 'minutes').toDate()),
    // closeDate: toUnixTime(now.add(5, 'days').toDate()),
  },
  stage: {
    // newOwner: MATAN_WALLET, //Matan
    newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF', //My s-owner2
    depositVerifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
    baseGoal: toBaseTokenWei(15),
    startDate: 0,
    // startDate: toUnixTime(new Date(2024, 4, 27, 19, 0, 0)),
    // closeDate: 0,
    closeDate: toUnixTime(new Date(2026, 4, 28, 23, 0, 0)),
  },
  prod: {
    newOwner: MATAN_WALLET, //Matan
    // newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF', //My s-owner2
    depositVerifier: '0x99FbD0Bc026128e6258BEAd542ECB1cF165Bbb98', //My s-deposit
    baseGoal: toBaseTokenWei(75_000),
    // baseGoal: toBaseTokenWei(5),
    baseToken: baseToken,
    baseDecimals: baseDecimals,
    // startDate: 0,
    startDate: toUnixTimeUtc(new Date(2024, 7, 8, 11, 0, 0)),
    // closeDate: 0,
    closeDate: toUnixTimeUtc(new Date(2024, 7, 12, 11, 0, 0)),
  },
};

const extContractConfig = contractConfigDeployMap[deployType];

export const contractConfig: ContractConfig = {
  newOwner: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
  baseToken: baseToken,
  baseDecimals: baseDecimals,
  boostToken: boostToken,
  boostDecimals: boostDecimals,
  depositVerifier: '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
  baseGoal: toBaseTokenWei(1_200) / priceDiv,
  startDate: toUnixTime(now.add(1, 'days').toDate()),
  closeDate: toUnixTime(now.add(2, 'days').toDate()),
  externalRefund: false,
  linearAllocation: true,
  linearBoostFactor: toWei(LINEAR_BOOST_FACTOR),
  ...extContractConfig,
};

export function getContractArgs(contractConfig: ContractConfig): DeployContractArgs {
  const {
    newOwner,
    baseToken,
    baseDecimals,
    boostToken,
    boostDecimals,
    depositVerifier,
    baseGoal,
    startDate,
    closeDate,
    externalRefund,
    linearAllocation,
    linearBoostFactor,
  } = contractConfig;
  return [
    {
      newOwner,
      baseToken,
      baseDecimals,
      boostToken,
      boostDecimals,
      depositVerifier,
      baseGoal,
      startDate,
      closeDate,
      externalRefund,
      linearAllocation,
      linearBoostFactor,
    },
  ];
}

export const tokenConfig: TokenConfig = {
  name: 'empty',
  symbol: 'empty',
  newOwner: '0x81aFFCB2FaCEcCaE727Fa4b1B2ef534a1Da67791',
  initMint: toBaseTokenWei(1_000_000_000),
  decimals: baseDecimals,
};

export function getTokenArgs(tokenConfig: TokenConfig): DeployTokenArgs {
  const { name, symbol, newOwner, initMint, decimals } = tokenConfig;
  return [name, symbol, newOwner, initMint, decimals];
}

const userInitBalance = toBaseTokenWei(100_000) / priceDiv;
const deposit1 = toBaseTokenWei(1_000) / priceDiv;
const extraDeposit1 = toBaseTokenWei(2_500) / priceDiv;
const accidentAmount = toBaseTokenWei(500) / priceDiv;

const transactionId1 = uuidv4();
const transactionId1_2 = uuidv4();
const transactionId2 = uuidv4();
const transactionId3 = uuidv4();

export const seedData = {
  zero: toBaseTokenWei(0),
  baseDecimals: BASE_DECIMALS,
  boostDecimals: BOOST_DECIMALS,
  totalAccountBalance: tokenConfig.initMint,
  userInitBalance,
  deposit1,
  deposit2: deposit1 / userDiv,
  deposit12: deposit1 + deposit1 / userDiv,
  extraDeposit1,
  extraDeposit2: extraDeposit1 / userDiv,
  extraDeposit3: extraDeposit1 / userDiv / userDiv,
  accidentAmount,
  newBaseGoal: toBaseTokenWei(100_000),
  allowance: toBaseTokenWei(1000000),
  baseBalanceDelta: toBaseTokenWei(0.001),
  boostBalanceDelta: toBoostTokenWei(0.001),
  weiDelta: toWei(0.001),
  nowPlus1m: toUnixTime(now.add(1, 'minute').toDate()),
  nowPlus1h: toUnixTime(now.add(1, 'hour').toDate()),
  startDatePlus1m: addSecondsToUnixTime(contractConfig.startDate, 1 * MINUTES),
  closeDatePlus1m: addSecondsToUnixTime(contractConfig.closeDate, 1 * MINUTES),
  timeShift: 10,
  batchSize: 1,
  boostExchangeRate: toWei(0.2),
  transactionId1,
  transactionId1_2,
  transactionId2,
  transactionId3,
  transactionIdWrong: 'wrong',
  invalidNonce: 999,
  depositNonce1_0: 0,
  depositNonce1_1: 1,
  depositNonce2_0: 0,
};
