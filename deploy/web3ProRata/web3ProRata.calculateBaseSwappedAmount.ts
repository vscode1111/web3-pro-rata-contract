import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, waitTx } from '~common-contract';
import { WEB3_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';
import { deployParams } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3ProRataAddress } = getAddressesFromHre(hre);
    console.log(
      `${WEB3_P_PRO_RATA_NAME} ${web3ProRataAddress} is calculating base swapped amount for users...`,
    );
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, web3ProRataAddress);
    const { owner2WEB3ProRata, web3ProRataFactory } = context;

    const params = {
      batchSize: 1,
    };

    console.table(params);

    await waitTx(
      owner2WEB3ProRata.calculateBaseSwappedAmount(params.batchSize, TX_OVERRIDES),
      'calculateBaseSwappedAmount',
      deployParams.attempts,
      deployParams.delay,
      web3ProRataFactory,
    );
  }, hre);
};

func.tags = [`${WEB3_P_PRO_RATA_NAME}:calculate-base-swapped-amount`];

export default func;
