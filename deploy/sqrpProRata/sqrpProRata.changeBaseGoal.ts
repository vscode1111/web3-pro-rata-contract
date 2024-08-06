import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, waitTx } from '~common-contract';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { getAddressesFromHre, getContext, getUsers } from '~utils';
import { getBaseTokenInfo } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is changing base goal to user...`);
    const users = await getUsers();
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, sqrpProRataAddress);
    const { owner2SQRpProRata } = context;
    const { decimals, tokenName } = await getBaseTokenInfo(users, owner2SQRpProRata);

    const amount = await owner2SQRpProRata.getBaseBalance();
    console.log(`${toNumberDecimals(amount, decimals)} ${tokenName} in contract`);

    const params = {
      baseGoal: seedData.newBaseGoal,
    };

    console.table(params);
    await waitTx(owner2SQRpProRata.changeBaseGoal(params.baseGoal, TX_OVERRIDES), 'changeBaseGoal');
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:change-base-goal`];

export default func;
