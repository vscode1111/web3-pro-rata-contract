import { upgrades } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, verifyContract } from '~common-contract';
import { WEB3_P_PRO_RATA_NAME } from '~constants';
import { getAddressesFromHre, getWEB3ProRataContext, getUsers } from '~utils';
import { verifyRequired } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3ProRataAddress } = getAddressesFromHre(hre);
    console.log(`${WEB3_P_PRO_RATA_NAME} ${web3ProRataAddress} is upgrading...`);
    const { owner2Web3pProRataFactory, owner2WEB3ProRata } =
      await getWEB3ProRataContext(await getUsers(), web3ProRataAddress);

    const users = await getUsers();
    const { owner2Address } = users;

    const owner = await owner2WEB3ProRata.owner();

    //Checks
    if (owner !== owner2Address) {
      console.error(`You aren't contract owner`);
      return;
    }

    await upgrades.upgradeProxy(web3ProRataAddress, owner2Web3pProRataFactory);
    console.log(`${WEB3_P_PRO_RATA_NAME} upgraded to ${web3ProRataAddress}`);
    if (verifyRequired) {
      await verifyContract(web3ProRataAddress, hre);
      console.log(
        `${WEB3_P_PRO_RATA_NAME} upgraded and verified to ${web3ProRataAddress}`,
      );
    }
  }, hre);
};

func.tags = [`${WEB3_P_PRO_RATA_NAME}:upgrade`];

export default func;
