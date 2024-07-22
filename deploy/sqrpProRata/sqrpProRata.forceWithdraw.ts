import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, waitTx } from '~common-contract';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext, getUsers } from '~utils';
import { getBaseTokenInfo } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is withdrawing to user...`);
    const users = await getUsers();
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, sqrpProRataAddress);
    const { user3Address, owner2SQRpProRata } = context;
    const { baseToken, decimals, tokenName } = await getBaseTokenInfo(users, owner2SQRpProRata);

    const amount = await owner2SQRpProRata.getBaseBalance();
    console.log(`${toNumberDecimals(amount, decimals)} ${tokenName} in contract`);

    const params = {
      token: baseToken,
      to: user3Address,
      amount,
    };

    console.table(params);
    await waitTx(
      owner2SQRpProRata.forceWithdraw(params.token, params.to, params.amount, TX_OVERRIDES),
      'forceWithdraw',
    );
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:force-withdraw`];

export default func;
