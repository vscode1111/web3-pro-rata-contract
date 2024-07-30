import { Numeric } from 'ethers';
import { toNumberDecimalsFixed } from '~common';
import { formatContractDate, formatContractToken } from '~common-contract';
import { ContractConfig, baseChainTokenDescription, contractConfig, getContractArgs } from '~seeds';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { Users } from '~types';
import { getERC20TokenContext } from '~utils';
import { verifyArgsRequired } from './deployData';

export function getContractArgsEx() {
  return verifyArgsRequired ? getContractArgs(contractConfig) : undefined;
}

export function formatContractConfig(contractConfig: ContractConfig) {
  const { decimals, tokenName } = baseChainTokenDescription.bsc;
  const { baseGoal, startDate, closeDate } = contractConfig;

  return {
    ...contractConfig,
    baseGoal: formatContractToken(baseGoal, decimals, tokenName),
    startDate: formatContractDate(startDate),
    closeDate: formatContractDate(closeDate),
  };
}

export async function getBaseTokenInfo(users: Users, userSQRpProRata: SQRpProRata) {
  const baseToken = await userSQRpProRata.baseToken();
  const { ownerERC20Token } = await getERC20TokenContext(users, baseToken);
  return {
    baseToken,
    decimals: Number(await ownerERC20Token.decimals()),
    tokenName: await ownerERC20Token.name(),
  };
}

interface FormattedAccountInfo {
  baseDeposited: string;
  boosted: boolean;
  baseAllocation: string;
  baseDeposit: string;
  baseRefund: string;
  baseRefunded: string;
  boostDeposit: string;
  boostRefund: string;
  boostRefunded: string;
  nonce: number;
  boostAverageExchangeRate: number;
  share: number;
}

export function formatAccountInfo(
  accountInfo: SQRpProRata.AccountInfoStruct,
  baseDecimals: Numeric,
  baseTokenName: string,
  boostDecimals: Numeric,
  boostTokenName: string,
): FormattedAccountInfo {
  const {
    baseDeposited,
    boosted,
    baseAllocation,
    baseDeposit,
    baseRefund,
    baseRefunded,
    boostDeposit,
    boostRefund,
    boostRefunded,
    nonce,
    boostAverageExchangeRate,
    share,
  } = accountInfo;

  return {
    baseDeposited: formatContractToken(baseDeposited, baseDecimals, baseTokenName),
    boosted,
    baseAllocation: formatContractToken(baseAllocation, baseDecimals, baseTokenName),
    baseDeposit: formatContractToken(baseDeposit, baseDecimals, baseTokenName),
    baseRefund: formatContractToken(baseRefund, baseDecimals, baseTokenName),
    baseRefunded: formatContractToken(baseRefunded, baseDecimals, baseTokenName),
    boostDeposit: formatContractToken(boostDeposit, boostDecimals, boostTokenName),
    boostRefund: formatContractToken(boostRefund, boostDecimals, boostTokenName),
    boostRefunded: formatContractToken(boostRefunded, boostDecimals, boostTokenName),
    nonce: Number(nonce),
    boostAverageExchangeRate: toNumberDecimalsFixed(boostAverageExchangeRate, undefined),
    share: toNumberDecimalsFixed(share, undefined),
  };
}

export async function printAccountInfo(
  ownerSQRpProRata: SQRpProRata,
  account: string,
  baseDecimals: Numeric,
  baseTokenName: string,
  boostDecimals: Numeric,
  boostTokenName: string,
) {
  const accountInfo = await ownerSQRpProRata.fetchAccountInfo(account);
  console.log(`User: ${account}`);
  console.log(
    formatAccountInfo(accountInfo, baseDecimals, baseTokenName, boostDecimals, boostTokenName),
  );
}
