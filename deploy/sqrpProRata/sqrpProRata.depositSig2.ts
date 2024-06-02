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
    const baseTokenAddress = contractConfig.baseToken;
    const context = await getContext(baseTokenAddress, sqrpProRataAddress);
    const { user2Address, user2BaseToken, user2SQRpProRata, sqrpProRataFactory, verifier } =
      context;

    const decimals = Number(await user2BaseToken.decimals());

    const currentAllowance = await user2BaseToken.allowance(user2Address, sqrpProRataAddress);
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    const nonce = await user2SQRpProRata.getNonce(user2Address);

    const params = {
      transactionId: seedData.depositTransactionId2,
      amount: deployData.deposit2,
      account: user2Address,
      nonce: Number(nonce),
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
      await waitTx(user2BaseToken.approve(sqrpProRataAddress, askAllowance), 'approve');
      console.log(
        `${toNumberDecimals(askAllowance, decimals)} SQR was approved to ${sqrpProRataAddress}`,
      );
    }

    console.table(params);

    await waitTx(
      user2SQRpProRata.depositSig(
        params.account,
        params.amount,
        params.transactionId,
        params.timestampLimit,
        params.signature,
        TX_OVERRIDES,
      ),
      'depositSig',
      deployParams.attempts,
      deployParams.delay,
      sqrpProRataFactory,
    );
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:deposit-sig2`];

export default func;
