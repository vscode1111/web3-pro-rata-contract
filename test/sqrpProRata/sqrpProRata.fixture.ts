import { ContractConfig, TokenConfig, contractConfig, tokenConfig } from '~seeds';
import { ContextBase } from '~types';
import { getERC20TokenContext, getSQRpProRataContext, getUsers } from '~utils';
import { SQRpProRataFixtureParamConfig } from './utils';

export async function deploySQRpProRataContractFixture(
  fixtureConfig?: SQRpProRataFixtureParamConfig,
): Promise<ContextBase> {
  const users = await getUsers();
  const { owner2Address } = users;

  const finalBaseTokenConfig: TokenConfig = {
    ...tokenConfig,
    decimals: fixtureConfig?.contractConfig?.baseDecimals ?? tokenConfig.decimals,
    ...fixtureConfig?.baseTokenConfig,
    newOwner: owner2Address,
  };
  const {
    erc20TokenAddress: baseTokenAddress,
    ownerERC20Token: ownerBaseToken,
    user1ERC20Token: user1BaseToken,
    user2ERC20Token: user2BaseToken,
    user3ERC20Token: user3BaseToken,
    owner2ERC20Token: owner2BaseToken,
  } = await getERC20TokenContext(users, finalBaseTokenConfig);

  const finalBoostTokenConfig: TokenConfig = {
    ...tokenConfig,
    decimals: fixtureConfig?.contractConfig?.boostDecimals ?? tokenConfig.decimals,
    ...fixtureConfig?.boostTokenConfig,
    newOwner: owner2Address,
  };
  const {
    erc20TokenAddress: boostTokenAddress,
    ownerERC20Token: ownerBoostToken,
    user1ERC20Token: user1BoostToken,
    user2ERC20Token: user2BoostToken,
    user3ERC20Token: user3BoostToken,
    owner2ERC20Token: owner2BoostToken,
  } = await getERC20TokenContext(users, finalBoostTokenConfig);

  const finalContractConfig: ContractConfig = {
    ...contractConfig,
    ...fixtureConfig?.contractConfig,
    newOwner: owner2Address,
    baseToken: baseTokenAddress,
    boostToken: boostTokenAddress,
  };
  const sqrpProRataContext = await getSQRpProRataContext(users, finalContractConfig);

  return {
    ...users,
    ...sqrpProRataContext,
    baseTokenAddress,
    ownerBaseToken,
    user1BaseToken,
    user2BaseToken,
    user3BaseToken,
    owner2BaseToken,
    boostTokenAddress,
    ownerBoostToken,
    user1BoostToken,
    user2BoostToken,
    user3BoostToken,
    owner2BoostToken,
  };
}
