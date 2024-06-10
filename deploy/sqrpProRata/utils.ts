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
  const { goal, startDate, closeDate } = contractConfig;

  return {
    ...contractConfig,
    goal: printToken(goal, decimals, tokenName),
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
