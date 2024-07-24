import { DeployProxyOptions } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { ethers, upgrades } from 'hardhat';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { ContractConfig, getContractArgs } from '~seeds';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { SQRpProRata__factory } from '~typechain-types/factories/contracts/SQRpProRata__factory';
import { SQRpProRataContext, Users } from '~types';

const OPTIONS: DeployProxyOptions = {
  initializer: 'initialize',
  kind: 'uups',
  txOverrides: TX_OVERRIDES,
};

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
