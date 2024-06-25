import { upgrades } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, verifyContract } from '~common-contract';
import { SQR_P_PRO_RATA_NAME } from '~constants';
import { getAddressesFromHre, getSQRpProRataContext, getUsers } from '~utils';
import { verifyRequired } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is upgrading...`);
    const { owner2SqrpProRataFactory, owner2SQRpProRata } = await getSQRpProRataContext(
      await getUsers(),
      sqrpProRataAddress,
    );

    const users = await getUsers();
    const { owner2Address } = users;

    const owner = await owner2SQRpProRata.owner();

    //Checks
    if (owner !== owner2Address) {
      console.error(`You aren't contract owner`);
      return;
    }

    await upgrades.upgradeProxy(sqrpProRataAddress, owner2SqrpProRataFactory);
    // await upgrades.forceImport(sqrpProRataAddress, owner2SqrpProRataFactory);
    console.log(`${SQR_P_PRO_RATA_NAME} upgraded to ${sqrpProRataAddress}`);
    if (verifyRequired) {
      await verifyContract(sqrpProRataAddress, hre);
      console.log(`${SQR_P_PRO_RATA_NAME} upgraded and verified to ${sqrpProRataAddress}`);
    }
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:upgrade`];

export default func;
