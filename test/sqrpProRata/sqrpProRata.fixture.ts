import { ContractConfig, contractConfig } from '~seeds';
import { ContextBase } from '~types';
import { getBaseTokenContext, getSQRpProRataContext, getUsers } from '~utils';

export async function deploySQRpProRataContractFixture(
  contractConfigParam?: Partial<ContractConfig>,
): Promise<ContextBase> {
  const users = await getUsers();
  const { owner2Address } = users;

  const baseTokenContext = await getBaseTokenContext(users);
  const { baseTokenAddress } = baseTokenContext;

  const config: ContractConfig = {
    ...contractConfig,
    ...contractConfigParam,
    newOwner: owner2Address,
    baseToken: baseTokenAddress,
  };

  const sqrpProRataContext = await getSQRpProRataContext(users, config);

  return {
    ...users,
    ...baseTokenContext,
    ...sqrpProRataContext,
  };
}
