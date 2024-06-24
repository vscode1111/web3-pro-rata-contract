import { printDate, printToken } from '~common-contract';
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
  const { baseGoal: goal, startDate, closeDate } = contractConfig;

  return {
    ...contractConfig,
    baseGoal: printToken(goal, decimals, tokenName),
    startDate: printDate(startDate),
    closeDate: printDate(closeDate),
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
  baseDepositAmount: string;
  baseRefunded: string;
  baseRefundAmount: string;
  nonce: number;
}

export function formatAccountInfo(
  accountInfo: SQRpProRata.AccountInfoStruct,
  decimals: number,
  tokenName?: string,
): FormattedAccountInfo {
  const { baseDeposited, baseDepositAmount, baseRefunded, baseRefundAmount, nonce } = accountInfo;

  return {
    baseDeposited: printToken(baseDeposited, decimals, tokenName),
    baseDepositAmount: printToken(baseDepositAmount, decimals, tokenName),
    baseRefunded: printToken(baseRefunded, decimals, tokenName),
    baseRefundAmount: printToken(baseRefundAmount, decimals, tokenName),
    nonce: Number(nonce),
  };
}

export async function printAccountInfo(
  ownerSQRpProRata: SQRpProRata,
  account: string,
  decimals: number,
  tokenName?: string,
) {
  const accountInfo = await ownerSQRpProRata.fetchAccountInfo(account);
  console.log(`User: ${account}`);
  console.log(formatAccountInfo(accountInfo, decimals, tokenName));
}
