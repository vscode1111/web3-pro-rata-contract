import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import {
  callWithTimerHre,
  formatContractDate,
  formatContractToken,
  waitTx,
} from '~common-contract';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { getAddressesFromHre, getContext, getUsers, signMessageForProRataDeposit } from '~utils';
import { deployData, deployParams } from './deployData';
import { getBaseTokenInfo } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is depositing...`);
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, sqrpProRataAddress);
    const { user2Address, user2BaseToken, user2SQRpProRata, sqrpProRataFactory, depositVerifier } =
      context;

    const { decimals, tokenName } = await getBaseTokenInfo(await getUsers(), user2SQRpProRata);

    const currentAllowance = await user2BaseToken.allowance(user2Address, sqrpProRataAddress);
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    const nonce = await user2SQRpProRata.getAccountDepositNonce(user2Address);

    const params = {
      transactionId: seedData.transactionId2,
      amount: deployData.deposit2,
      boost: true,
      account: user2Address,
      boostExchangeRate: seedData.boostExchangeRate,
      nonce: Number(nonce),
      timestampLimit: seedData.nowPlus1m,
      signature: '',
    };

    params.signature = await signMessageForProRataDeposit(
      depositVerifier,
      params.account,
      params.amount,
      params.boost,
      params.boostExchangeRate,
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

    console.table({
      ...params,
      amount: formatContractToken(params.amount, decimals, tokenName),
      timestampLimit: formatContractDate(params.timestampLimit),
    });

    await waitTx(
      user2SQRpProRata.depositSig(
        {
          baseAmount: params.amount,
          boost: params.boost,
          boostExchangeRate: params.boostExchangeRate,
          transactionId: params.transactionId,
          timestampLimit: params.timestampLimit,
          signature: params.signature,
        },
        TX_OVERRIDES,
      ),
      'depositSig',
      deployParams.attempts,
      deployParams.delay,
      sqrpProRataFactory,
    );
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:boost-deposit-sig2`];

export default func;
