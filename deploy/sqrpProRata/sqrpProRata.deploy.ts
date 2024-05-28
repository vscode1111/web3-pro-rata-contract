import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { MS_IN_SEC, sleep } from '~common';
import { callWithTimerHre, verifyContract } from '~common-contract';
import { SQR_P_PRO_RATA_NAME } from '~constants';
import { contractConfig } from '~seeds';
import { getSQRpProRataContext, getUsers } from '~utils';
import { verifyRequired } from './deployData';
import { formatContractConfig, getContractArgsEx } from './utils';

const pauseTime = 10;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    console.log(`${SQR_P_PRO_RATA_NAME} is deploying...`);
    console.table(formatContractConfig(contractConfig));
    console.log(`Pause ${pauseTime} sec to make sure...`);
    await sleep(pauseTime * MS_IN_SEC);

    console.log(`Deploying...`);
    const { sqrpProRataAddress } = await getSQRpProRataContext(
      await getUsers(),
      contractConfig,
    );
    console.log(`${SQR_P_PRO_RATA_NAME} deployed to ${sqrpProRataAddress}`);
    if (verifyRequired) {
      await verifyContract(sqrpProRataAddress, hre, getContractArgsEx());
      console.log(
        `${SQR_P_PRO_RATA_NAME} deployed and verified to ${sqrpProRataAddress}`,
      );
    }
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:deploy`];

export default func;
