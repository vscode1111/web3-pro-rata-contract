import { toUnixTime } from '~common';
import { BaseContractConfig, ContractConfig, now } from '~seeds';

export function getBaseContactConfig(contactConfig: ContractConfig): BaseContractConfig {
  const { baseToken, boostToken, newOwner, ...rest } = contactConfig;

  // delete newContactConfig.baseToken;
  // delete newContactConfig.boostToken;
  // return newContactConfig;

  return rest;
}

let counter = 0;
export function getTestCaseContactConfig(contactConfig: ContractConfig): BaseContractConfig {
  counter += 10;
  return {
    ...getBaseContactConfig(contactConfig),
    startDate: toUnixTime(now.add(counter, 'days').toDate()),
    closeDate: toUnixTime(now.add(counter + 1, 'days').toDate()),
  };
}
