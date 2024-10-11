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
    const { user2Address, user2WEB3ProRata, web3ProRataFactory, depositVerifier } = context;

    const { baseToken, decimals, tokenName } = await getBaseTokenInfo(users, user2WEB3ProRata);
    console.log(`base token: ${baseToken}`);
    const { user2ERC20Token: user2BaseToken } = await getERC20TokenContext(users, baseToken);

    const currentAllowance = await user2BaseToken.allowance(user2Address, web3ProRataAddress);
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    const nonce = await user2WEB3ProRata.getAccountDepositNonce(user2Address);

    const params = {
      transactionId: seedData.transactionId2,
      amount: deployData.deposit2,
      boost: false,
      account: user2Address,
      boostExchangeRate: seedData.zero,
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
      await waitTx(user2BaseToken.approve(web3ProRataAddress, askAllowance), 'approve');
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
      user2WEB3ProRata.depositSig(
        {
          baseAmount: params.amount,
          boost: params.boost,
          boostExchangeRate: seedData.zero,
          transactionId: params.transactionId,
          timestampLimit: params.timestampLimit,
          signature: params.signature,
        },
        TX_OVERRIDES,
      ),
      'depositSig',
      deployParams.attempts,
      deployParams.delay,
      web3ProRataFactory,
    );
  }, hre);
};

func.tags = [`${WEB3_P_PRO_RATA_NAME}:base-deposit-sig2`];

export default func;
