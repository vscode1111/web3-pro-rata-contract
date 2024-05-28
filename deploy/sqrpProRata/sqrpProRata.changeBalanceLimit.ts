import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, waitTx } from '~common-contract';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';
import { deployData } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(
      `${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is withdrawing to user...`,
    );
    const erc20TokenAddress = contractConfig.erc20Token;
    const context = await getContext(erc20TokenAddress, sqrpProRataAddress);
    const { owner2SQRpProRata } = context;

    const params = {
      balanceLimit: deployData.balanceLimit,
    };

    console.table(params);
    await waitTx(
      owner2SQRpProRata.changeBalanceLimit(params.balanceLimit, TX_OVERRIDES),
      'changeBalanceLimit',
    );
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:change-balance-limit`];

export default func;
