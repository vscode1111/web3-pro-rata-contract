import { DeployProxyOptions } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { ethers, upgrades } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getNetworkName } from '~common-contract';
import { CONTRACTS, ERC20_TOKEN_NAME, SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { ContractConfig, getContractArgs, getTokenArgs } from '~seeds';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { ERC20Token__factory } from '~typechain-types/factories/contracts/ERC20Token__factory';
import { SQRpProRata__factory } from '~typechain-types/factories/contracts/SQRpProRata__factory';
import {
  Addresses,
  ContextBase,
  DeployNetworks,
  ERC20TokenContext,
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
  const [owner, user1, user2, user3, owner2, coldWallet, verifier] = await ethers.getSigners();

  const ownerAddress = await owner.getAddress();
  const user1Address = await user1.getAddress();
  const user2Address = await user2.getAddress();
  const user3Address = await user3.getAddress();
  const owner2Address = await owner2.getAddress();
  const coldWalletAddress = await coldWallet.getAddress();
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
    coldWallet,
    coldWalletAddress,
    verifier,
    verifierAddress,
  };
}

export async function getERC20TokenContext(
  users: Users,
  deployData?: string | { newOwner: string },
): Promise<ERC20TokenContext> {
  const { owner, user1, user2, user3, owner2, owner2Address, coldWallet } = users;

  const testERC20TokenFactory = (await ethers.getContractFactory(
    ERC20_TOKEN_NAME,
  )) as unknown as ERC20Token__factory;

  let ownerERC20Token: ERC20Token;

  if (typeof deployData === 'string') {
    ownerERC20Token = testERC20TokenFactory.connect(owner).attach(deployData) as ERC20Token;
  } else {
    const newOwner = deployData?.newOwner ?? owner2Address;
    ownerERC20Token = await testERC20TokenFactory.connect(owner).deploy(...getTokenArgs(newOwner));
  }

  const erc20TokenAddress = await ownerERC20Token.getAddress();

  const user1ERC20Token = ownerERC20Token.connect(user1);
  const user2ERC20Token = ownerERC20Token.connect(user2);
  const user3ERC20Token = ownerERC20Token.connect(user3);
  const owner2ERC20Token = ownerERC20Token.connect(owner2);
  const coldWalletERC20Token = ownerERC20Token.connect(coldWallet);

  return {
    erc20TokenAddress,
    ownerERC20Token,
    user1ERC20Token,
    user2ERC20Token,
    user3ERC20Token,
    owner2ERC20Token,
    coldWalletERC20Token,
  };
}

export async function getSQRpProRataContext(
  users: Users,
  deployData?: string | ContractConfig,
): Promise<SQRpProRataContext> {
  const { owner, user1, user2, user3, owner2, coldWallet } = users;

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
  const coldWalletSQRpProRata = ownerSQRpProRata.connect(coldWallet);

  return {
    sqrpProRataFactory,
    owner2SqrpProRataFactory: owner2SqrpProRataFactory,
    sqrpProRataAddress,
    ownerSQRpProRata,
    user1SQRpProRata,
    user2SQRpProRata,
    user3SQRpProRata,
    owner2SQRpProRata,
    coldWalletSQRpProRata,
  };
}

export async function getContext(
  erc20TokenAddress: string,
  sqrpProRataAddress: string,
): Promise<ContextBase> {
  const users = await getUsers();
  const erc20TokenContext = await getERC20TokenContext(users, erc20TokenAddress);
  const sqrpProRataContext = await getSQRpProRataContext(users, sqrpProRataAddress);

  return {
    ...users,
    ...erc20TokenContext,
    ...sqrpProRataContext,
  };
}
