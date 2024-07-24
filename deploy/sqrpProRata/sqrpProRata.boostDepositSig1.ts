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
import {
  getAddressesFromHre,
  getContext,
  getERC20TokenContext,
  getUsers,
  signMessageForProRataDeposit,
} from '~utils';
import { deployData, deployParams } from './deployData';
import { getBaseTokenInfo } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is depositing...`);
    const users = await getUsers();
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, sqrpProRataAddress);
    const { depositVerifier, user1Address, user1SQRpProRata, sqrpProRataFactory } = context;

    const { baseToken, decimals, tokenName } = await getBaseTokenInfo(users, user1SQRpProRata);
    console.log(`base token: ${baseToken}`);
    const { user1ERC20Token: user1BaseToken } = await getERC20TokenContext(users, baseToken);

    const currentAllowance = await user1BaseToken.allowance(user1Address, sqrpProRataAddress);
    console.log(`${toNumberDecimals(currentAllowance, decimals)} token was allowed`);

    const nonce = await user1SQRpProRata.getAccountDepositNonce(user1Address);
    const params = {
      account: user1Address,
      amount: deployData.deposit1,
      nonce: Number(nonce),
      boost: true,
      boostExchangeRate: seedData.boostExchangeRate,
      transactionId: seedData.transactionId1,
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
      await waitTx(
        user1BaseToken.approve(sqrpProRataAddress, askAllowance, TX_OVERRIDES),
        'approve',
      );
      console.log(
        `${toNumberDecimals(askAllowance, decimals)} ${tokenName} was approved to ${sqrpProRataAddress}`,
      );
    }

    console.table({
      ...params,
      amount: formatContractToken(params.amount, decimals, tokenName),
      timestampLimit: formatContractDate(params.timestampLimit),
    });

    await waitTx(
      user1SQRpProRata.depositSig({
        baseAmount: params.amount,
        boost: params.boost,
        boostExchangeRate: params.boostExchangeRate,
        transactionId: params.transactionId,
        timestampLimit: params.timestampLimit,
        signature: params.signature,
      }),
      'depositSig',
      deployParams.attempts,
      deployParams.delay,
      sqrpProRataFactory,
    );
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:boost-deposit-sig1`];

export default func;
