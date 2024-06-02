import { DeployProxyOptions } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { ethers, upgrades } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getNetworkName } from '~common-contract';
import { BASE_TOKEN_NAME, CONTRACTS, SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { ContractConfig, getContractArgs, getTokenArgs } from '~seeds';
import { BaseToken } from '~typechain-types/contracts/BaseToken';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { BaseToken__factory } from '~typechain-types/factories/contracts/BaseToken__factory';
import { SQRpProRata__factory } from '~typechain-types/factories/contracts/SQRpProRata__factory';
import {
  Addresses,
  BaseTokenContext,
  ContextBase,
  DeployNetworks,
  SQRpProRataContext,
  Users,
} from '~types';

const OPTIONS: DeployProxyOptions = {
  initializer: 'initialize',
  kind: 'uups',
  txOverrides: TX_OVERRIDES,
};

export function getAddresses(network: keyof DeployNetworks): Addresses {
  const sqrpProRataAddress = CONTRACTS.SQR_P_PRO_RATA[network];
  return {
    sqrpProRataAddress,
  };
}

export function getAddressesFromHre(hre: HardhatRuntimeEnvironment) {
  return getAddresses(getNetworkName(hre));
}

export async function getUsers(): Promise<Users> {
  const [owner, user1, user2, user3, owner2, verifier] = await ethers.getSigners();

  const ownerAddress = await owner.getAddress();
  const user1Address = await user1.getAddress();
  const user2Address = await user2.getAddress();
  const user3Address = await user3.getAddress();
  const owner2Address = await owner2.getAddress();
  const verifierAddress = await verifier.getAddress();

  return {
    owner,
    ownerAddress,
    user1,
    user1Address,
    user2,
    user2Address,
    user3,
    user3Address,
    owner2,
    owner2Address,
    verifier,
    verifierAddress,
  };
}

export async function getBaseTokenContext(
  users: Users,
  deployData?: string | { newOwner: string },
): Promise<BaseTokenContext> {
  const { owner, user1, user2, user3, owner2, owner2Address } = users;

  const testBaseTokenFactory = (await ethers.getContractFactory(
    BASE_TOKEN_NAME,
  )) as unknown as BaseToken__factory;

  let ownerBaseToken: BaseToken;

  if (typeof deployData === 'string') {
    ownerBaseToken = testBaseTokenFactory.connect(owner).attach(deployData) as BaseToken;
  } else {
    const newOwner = deployData?.newOwner ?? owner2Address;
    ownerBaseToken = await testBaseTokenFactory.connect(owner).deploy(...getTokenArgs(newOwner));
  }

  const baseTokenAddress = await ownerBaseToken.getAddress();

  const user1BaseToken = ownerBaseToken.connect(user1);
  const user2BaseToken = ownerBaseToken.connect(user2);
  const user3BaseToken = ownerBaseToken.connect(user3);
  const owner2BaseToken = ownerBaseToken.connect(owner2);

  return {
    baseTokenAddress,
    ownerBaseToken,
    user1BaseToken,
    user2BaseToken,
    user3BaseToken,
    owner2BaseToken,
  };
}

export async function getSQRpProRataContext(
  users: Users,
  deployData?: string | ContractConfig,
): Promise<SQRpProRataContext> {
  const { owner, user1, user2, user3, owner2 } = users;

  const sqrpProRataFactory = (await ethers.getContractFactory(
    SQR_P_PRO_RATA_NAME,
  )) as unknown as SQRpProRata__factory;
  const owner2SqrpProRataFactory = (await ethers.getContractFactory(
    SQR_P_PRO_RATA_NAME,
    owner2,
  )) as unknown as SQRpProRata__factory;

  let ownerSQRpProRata: SQRpProRata;

  if (typeof deployData === 'string') {
    ownerSQRpProRata = sqrpProRataFactory.connect(owner).attach(deployData) as SQRpProRata;
  } else {
    ownerSQRpProRata = (await upgrades.deployProxy(
      sqrpProRataFactory,
      getContractArgs(deployData as ContractConfig),
      OPTIONS,
    )) as unknown as SQRpProRata;
  }

  const sqrpProRataAddress = await ownerSQRpProRata.getAddress();

  const user1SQRpProRata = ownerSQRpProRata.connect(user1);
  const user2SQRpProRata = ownerSQRpProRata.connect(user2);
  const user3SQRpProRata = ownerSQRpProRata.connect(user3);
  const owner2SQRpProRata = ownerSQRpProRata.connect(owner2);

  return {
    sqrpProRataFactory,
    owner2SqrpProRataFactory,
    sqrpProRataAddress,
    ownerSQRpProRata,
    user1SQRpProRata,
    user2SQRpProRata,
    user3SQRpProRata,
    owner2SQRpProRata,
  };
}

export async function getContext(
  BaseTokenAddress: string,
  sqrpProRataAddress: string,
): Promise<ContextBase> {
  const users = await getUsers();
  const BaseTokenContext = await getBaseTokenContext(users, BaseTokenAddress);
  const sqrpProRataContext = await getSQRpProRataContext(users, sqrpProRataAddress);

  return {
    ...users,
    ...BaseTokenContext,
    ...sqrpProRataContext,
  };
}
