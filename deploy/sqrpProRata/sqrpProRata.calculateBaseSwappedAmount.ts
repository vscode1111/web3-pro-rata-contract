import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, waitTx } from '~common-contract';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';
import { deployParams } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(
      `${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is calculating base swapped amount for users...`,
    );
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, sqrpProRataAddress);
    const { owner2SQRpProRata, sqrpProRataFactory } = context;

    const params = {
      batchSize: 1,
    };

    console.table(params);

    await waitTx(
      owner2SQRpProRata.calculateBaseSwappedAmount(params.batchSize, TX_OVERRIDES),
      'calculateBaseSwappedAmount',
      deployParams.attempts,
      deployParams.delay,
      sqrpProRataFactory,
    );
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:calculate-base-swapped-amount`];

export default func;
