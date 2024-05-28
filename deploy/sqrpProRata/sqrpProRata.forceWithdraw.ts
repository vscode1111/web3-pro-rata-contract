import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, waitTx } from '~common-contract';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext } from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(
      `${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is withdrawing to user...`,
    );
    const erc20TokenAddress = contractConfig.erc20Token;
    const context = await getContext(erc20TokenAddress, sqrpProRataAddress);
    const { user3Address, owner2SQRpProRata, user1ERC20Token } = context;

    const decimals = Number(await user1ERC20Token.decimals());

    const amount = await owner2SQRpProRata.getBalance();
    console.log(`${toNumberDecimals(amount, decimals)} SQR in contract`);

    const params = {
      token: erc20TokenAddress,
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
