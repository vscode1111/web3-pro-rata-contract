import { printDate, printToken } from '~common-contract';
import { ContractConfig, chainTokenDescription, contractConfig, getContractArgs } from '~seeds';
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
