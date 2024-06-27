import { Numeric } from 'ethers';
import { formatContractDate, formatContractToken } from '~common-contract';
import { ContractConfig, chainTokenDescription, contractConfig, getContractArgs } from '~seeds';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { Users } from '~types';
import { getBaseTokenContext } from '~utils';
import { verifyArgsRequired } from './deployData';

export function getContractArgsEx() {
  return verifyArgsRequired ? getContractArgs(contractConfig) : undefined;
}

export function formatContractConfig(contractConfig: ContractConfig) {
  const { decimals, tokenName } = chainTokenDescription.bsc;
  const { baseGoal, startDate, closeDate } = contractConfig;

  return {
    ...contractConfig,
    baseGoal: formatContractToken(baseGoal, decimals, tokenName),
    startDate: formatContractDate(startDate),
    closeDate: formatContractDate(closeDate),
  };
}

export async function getTokenInfo(users: Users, userSQRpProRata: SQRpProRata) {
  const baseToken = await userSQRpProRata.baseToken();
  const { ownerBaseToken } = await getBaseTokenContext(users, baseToken);
  return {
    decimals: Number(await ownerBaseToken.decimals()),
    tokenName: await ownerBaseToken.name(),
  };
}

interface FormattedAccountInfo {
  baseDeposited: string;
  baseAllocation: string;
  baseDeposit: string;
  baseRefund: string;
  baseRefunded: string;
  boostDeposit: string;
  boostRefund: string;
  boostRefunded: string;
  nonce: number;
}

export function formatAccountInfo(
  accountInfo: SQRpProRata.AccountInfoStruct,
  decimals: Numeric,
  tokenName?: string,
): FormattedAccountInfo {
  const {
    baseDeposited,
    baseAllocation,
    baseDeposit,
    baseRefund,
    baseRefunded,
    boostDeposit,
    boostRefund,
    boostRefunded,
    nonce,
  } = accountInfo;

  return {
    baseDeposited: formatContractToken(baseDeposited, decimals, tokenName),
    baseDeposit: formatContractToken(baseDeposit, decimals, tokenName),
    baseAllocation: formatContractToken(baseAllocation, decimals, tokenName),
    baseRefund: formatContractToken(baseRefund, decimals, tokenName),
    baseRefunded: formatContractToken(baseRefunded, decimals, tokenName),
    boostDeposit: formatContractToken(boostDeposit, decimals, tokenName),
    boostRefund: formatContractToken(boostRefund, decimals, tokenName),
    boostRefunded: formatContractToken(boostRefunded, decimals, tokenName),
    nonce: Number(nonce),
  };
}

export async function printAccountInfo(
  ownerSQRpProRata: SQRpProRata,
  account: string,
  decimals: Numeric,
  tokenName?: string,
) {
  const accountInfo = await ownerSQRpProRata.fetchAccountInfo(account);
  console.log(`User: ${account}`);
  console.log(formatAccountInfo(accountInfo, decimals, tokenName));
}
