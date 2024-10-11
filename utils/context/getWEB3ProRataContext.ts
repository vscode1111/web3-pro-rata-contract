import { DeployProxyOptions } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { ethers, upgrades } from 'hardhat';
import { WEB3_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { ContractConfig, getContractArgs } from '~seeds';
import { WEB3ProRata } from '~typechain-types/contracts/WEB3ProRata';
import { WEB3ProRata__factory } from '~typechain-types/factories/contracts/WEB3ProRata__factory';
import { WEB3ProRataContext, Users } from '~types';

const OPTIONS: DeployProxyOptions = {
  initializer: 'initialize',
  kind: 'uups',
  txOverrides: TX_OVERRIDES,
};

export async function getWEB3ProRataContext(
  users: Users,
  deployData?: string | ContractConfig,
): Promise<WEB3ProRataContext> {
  const { owner, user1, user2, user3, owner2 } = users;

  const web3ProRataFactory = (await ethers.getContractFactory(
    WEB3_P_PRO_RATA_NAME,
  )) as unknown as WEB3ProRata__factory;
  const owner2Web3pProRataFactory = (await ethers.getContractFactory(
    WEB3_P_PRO_RATA_NAME,
    owner2,
  )) as unknown as WEB3ProRata__factory;

  let ownerWEB3ProRata: WEB3ProRata;

  if (typeof deployData === 'string') {
    ownerWEB3ProRata = web3ProRataFactory.connect(owner).attach(deployData) as WEB3ProRata;
  } else {
    ownerWEB3ProRata = (await upgrades.deployProxy(
      web3ProRataFactory,
      getContractArgs(deployData as ContractConfig),
      OPTIONS,
    )) as unknown as WEB3ProRata;
  }

  const web3ProRataAddress = await ownerWEB3ProRata.getAddress();

  const user1WEB3ProRata = ownerWEB3ProRata.connect(user1);
  const user2WEB3ProRata = ownerWEB3ProRata.connect(user2);
  const user3WEB3ProRata = ownerWEB3ProRata.connect(user3);
  const owner2WEB3ProRata = ownerWEB3ProRata.connect(owner2);

  return {
    web3ProRataFactory,
    owner2Web3pProRataFactory,
    web3ProRataAddress,
    ownerWEB3ProRata,
    user1WEB3ProRata,
    user2WEB3ProRata,
    user3WEB3ProRata,
    owner2WEB3ProRata,
  };
}
