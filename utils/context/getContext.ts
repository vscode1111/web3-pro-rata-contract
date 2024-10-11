import { ContextBase } from '~types';
import { getWEB3ProRataContext } from '.';
import { getERC20TokenContext } from './getERC20TokenContext';
import { getUsers } from './getUsers';

export async function getContext(
  baseTokenAddress: string,
  boostTokenAddress: string,
  web3ProRataAddress: string,
): Promise<ContextBase> {
  const users = await getUsers();
  const {
    ownerERC20Token: ownerBaseToken,
    user1ERC20Token: user1BaseToken,
    user2ERC20Token: user2BaseToken,
    user3ERC20Token: user3BaseToken,
    owner2ERC20Token: owner2BaseToken,
  } = await getERC20TokenContext(users, baseTokenAddress);

  const {
    ownerERC20Token: ownerBoostToken,
    user1ERC20Token: user1BoostToken,
    user2ERC20Token: user2BoostToken,
    user3ERC20Token: user3BoostToken,
    owner2ERC20Token: owner2BoostToken,
  } = await getERC20TokenContext(users, boostTokenAddress);

  const web3ProRataContext = await getWEB3ProRataContext(users, web3ProRataAddress);

  return {
    ...users,
    ...web3ProRataContext,
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
