import { BaseContractConfig, ContractConfig } from '~seeds';

export function getBaseContactConfig(contactConfig: ContractConfig): BaseContractConfig {
  const { baseToken, boostToken, newOwner, ...rest } = contactConfig;

  // delete newContactConfig.baseToken;
  // delete newContactConfig.boostToken;
  // return newContactConfig;

  return rest;
}
