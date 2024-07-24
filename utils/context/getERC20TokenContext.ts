import { ethers } from 'hardhat';
import { ERC20_TOKEN_NAME } from '~constants';
import { TokenConfig, getTokenArgs } from '~seeds';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { ERC20Token__factory } from '~typechain-types/factories/contracts/ERC20Token__factory';
import { ERC20TokenContext, Users } from '~types';

export async function getERC20TokenContext(
  users: Users,
  deployData?: string | TokenConfig,
): Promise<ERC20TokenContext> {
  const { owner, user1, user2, user3, owner2 } = users;

  const erc20TokenFactory = (await ethers.getContractFactory(
    ERC20_TOKEN_NAME,
  )) as unknown as ERC20Token__factory;

  let ownerERC20Token: ERC20Token;

  if (typeof deployData === 'string') {
    ownerERC20Token = erc20TokenFactory.connect(owner).attach(deployData) as ERC20Token;
  } else {
    ownerERC20Token = await erc20TokenFactory
      .connect(owner)
      .deploy(...getTokenArgs(deployData as TokenConfig));
  }

  const erc20TokenAddress = await ownerERC20Token.getAddress();

  const user1ERC20Token = ownerERC20Token.connect(user1);
  const user2ERC20Token = ownerERC20Token.connect(user2);
  const user3ERC20Token = ownerERC20Token.connect(user3);
  const owner2ERC20Token = ownerERC20Token.connect(owner2);

  return {
    erc20TokenAddress,
    ownerERC20Token,
    user1ERC20Token,
    user2ERC20Token,
    user3ERC20Token,
    owner2ERC20Token,
  };
}
