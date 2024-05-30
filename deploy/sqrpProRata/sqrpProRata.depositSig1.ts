import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, waitTx } from '~common-contract';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { getAddressesFromHre, getContext, signMessageForDeposit } from '~utils';
import { deployData, deployParams } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is depositing...`);
    const erc20TokenAddress = contractConfig.erc20Token;
    const context = await getContext(erc20TokenAddress, sqrpProRataAddress);
    const { verifier, user1Address, user1ERC20Token, user1SQRpProRata, sqrpProRataFactory } =
      context;

    const decimals = Number(await user1ERC20Token.decimals());

    const currentAllowance = await user1ERC20Token.allowance(user1Address, sqrpProRataAddress);
    console.log(`${toNumberDecimals(currentAllowance, decimals)} token was allowed`);

    const nonce = await user1SQRpProRata.getNonce(user1Address);

    const params = {
      account: user1Address,
      amount: deployData.deposit1,
      // amount: seedData.extraDeposit1,
      nonce: Number(nonce),
      transactionId: seedData.depositTransactionId1,
      timestampLimit: seedData.nowPlus1m,
      signature: '',
    };

    params.signature = await signMessageForDeposit(
      verifier,
      params.account,
      params.amount,
      params.nonce,
      params.transactionId,
      params.timestampLimit,
    );

    if (params.amount > currentAllowance) {
      const askAllowance = seedData.allowance;
      await waitTx(
        user1ERC20Token.approve(sqrpProRataAddress, askAllowance, TX_OVERRIDES),
        'approve',
      );
      console.log(
        `${toNumberDecimals(askAllowance, decimals)} SQR was approved to ${sqrpProRataAddress}`,
      );
    }

    console.table(params);

    await waitTx(
      user1SQRpProRata.depositSig(
        params.account,
        params.amount,
        params.transactionId,
        params.timestampLimit,
        params.signature,
      ),
      'depositSig',
      deployParams.attempts,
      deployParams.delay,
      sqrpProRataFactory,
    );
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:deposit-sig1`];

export default func;
