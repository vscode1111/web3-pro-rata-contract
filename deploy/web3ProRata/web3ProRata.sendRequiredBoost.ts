import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, formatContractToken, waitTx } from '~common-contract';
import { WEB3_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';
import { deployParams } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3ProRataAddress } = getAddressesFromHre(hre);
    console.log(`${WEB3_P_PRO_RATA_NAME} ${web3ProRataAddress} is sending required boost tokens...`);
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, web3ProRataAddress);
    const { owner2WEB3ProRata, web3ProRataFactory, owner2BoostToken } = context;

    const requiredBoostAmount = await owner2WEB3ProRata.calculateRequiredBoostAmount();

    const [boostDecimals, boostTokenName] = await Promise.all([
      owner2BoostToken.decimals(),
      owner2BoostToken.name(),
    ]);

    console.log(
      `Amount: ${formatContractToken(requiredBoostAmount, boostDecimals, boostTokenName)}`,
    );

    await waitTx(
      owner2BoostToken.transfer(web3ProRataAddress, requiredBoostAmount, TX_OVERRIDES),
      'transfer',
      deployParams.attempts,
      deployParams.delay,
      web3ProRataFactory,
    );
  }, hre);
};

func.tags = [`${WEB3_P_PRO_RATA_NAME}:send-required-boost`];

export default func;
