import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, formatContractToken, waitTx } from '~common-contract';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';
import { deployParams } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is sending required boost tokens...`);
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, sqrpProRataAddress);
    const { owner2SQRpProRata, sqrpProRataFactory, owner2BoostToken } = context;

    const requiredBoostAmount = await owner2SQRpProRata.calculateRequiredBoostAmount();

    const [boostDecimals, boostTokenName] = await Promise.all([
      owner2BoostToken.decimals(),
      owner2BoostToken.name(),
    ]);

    console.log(
      `Amount: ${formatContractToken(requiredBoostAmount, boostDecimals, boostTokenName)}`,
    );

    await owner2BoostToken.transfer(sqrpProRataAddress, requiredBoostAmount);

    await waitTx(
      owner2BoostToken.transfer(sqrpProRataAddress, requiredBoostAmount, TX_OVERRIDES),
      'transfer',
      deployParams.attempts,
      deployParams.delay,
      sqrpProRataFactory,
    );
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:send-required-boost`];

export default func;
