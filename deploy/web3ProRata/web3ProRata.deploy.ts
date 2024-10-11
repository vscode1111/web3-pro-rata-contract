import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { MS_IN_SEC, sleep } from '~common';
import { callWithTimerHre, verifyContract } from '~common-contract';
import { WEB3_P_PRO_RATA_NAME } from '~constants';
import { contractConfig } from '~seeds';
import { getWEB3ProRataContext, getUsers } from '~utils';
import { verifyRequired } from './deployData';
import { formatContractConfig, getContractArgsEx } from './utils';

const pauseTime = 10;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    console.log(`${WEB3_P_PRO_RATA_NAME} is deploying...`);
    console.table(formatContractConfig(contractConfig));
    console.log(`Pause ${pauseTime} sec to make sure...`);
    await sleep(pauseTime * MS_IN_SEC);

    console.log(`Deploying...`);
    const { web3ProRataAddress } = await getWEB3ProRataContext(
      await getUsers(),
      contractConfig,
    );
    console.log(`${WEB3_P_PRO_RATA_NAME} deployed to ${web3ProRataAddress}`);
    if (verifyRequired) {
      await verifyContract(web3ProRataAddress, hre, getContractArgsEx());
      console.log(
        `${WEB3_P_PRO_RATA_NAME} deployed and verified to ${web3ProRataAddress}`,
      );
    }
  }, hre);
};

func.tags = [`${WEB3_P_PRO_RATA_NAME}:deploy`];

export default func;
