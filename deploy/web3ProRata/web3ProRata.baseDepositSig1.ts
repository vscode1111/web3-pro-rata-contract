import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import {
  callWithTimerHre,
  formatContractDate,
  formatContractToken,
  waitTx,
} from '~common-contract';
import { WEB3_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
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
    const { web3ProRataAddress } = getAddressesFromHre(hre);
    console.log(`${WEB3_P_PRO_RATA_NAME} ${web3ProRataAddress} is depositing...`);
    const users = await getUsers();
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, web3ProRataAddress);
    const { depositVerifier, user1Address, user1WEB3ProRata, web3ProRataFactory } = context;

    const { baseToken, decimals, tokenName } = await getBaseTokenInfo(users, user1WEB3ProRata);
    console.log(`base token: ${baseToken}`);
    const { user1ERC20Token: user1BaseToken } = await getERC20TokenContext(users, baseToken);

    const currentAllowance = await user1BaseToken.allowance(user1Address, web3ProRataAddress);
    console.log(`${toNumberDecimals(currentAllowance, decimals)} token was allowed`);

    const nonce = await user1WEB3ProRata.getAccountDepositNonce(user1Address);
    const params = {
      account: user1Address,
      amount: deployData.deposit1,
      nonce: Number(nonce),
      boost: false,
      boostExchangeRate: seedData.zero,
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
        user1BaseToken.approve(web3ProRataAddress, askAllowance, TX_OVERRIDES),
        'approve',
      );
      console.log(
        `${toNumberDecimals(askAllowance, decimals)} ${tokenName} was approved to ${web3ProRataAddress}`,
      );
    }

    console.table({
      ...params,
      amount: formatContractToken(params.amount, decimals, tokenName),
      timestampLimit: formatContractDate(params.timestampLimit),
    });

    await waitTx(
      user1WEB3ProRata.depositSig({
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
      web3ProRataFactory,
    );
  }, hre);
};

func.tags = [`${WEB3_P_PRO_RATA_NAME}:base-deposit-sig1`];

export default func;
