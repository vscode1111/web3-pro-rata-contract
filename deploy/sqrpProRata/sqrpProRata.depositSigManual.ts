import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals, toNumberDecimalsFixed } from '~common';
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
  getUsers,
  signMessageForProRataDeposit,
  toBaseTokenWei,
} from '~utils';
import { deployParams } from './deployData';
import { DepositSigParams, DepositSigParamsForFront } from './types';
import { getBaseTokenInfo } from './utils';

const CHECK_REQUIRED = false;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is depositing...`);
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, sqrpProRataAddress);

    const { depositVerifier, user1Address, user1BaseToken, user1SQRpProRata, sqrpProRataFactory } =
      context;

    const { decimals, tokenName } = await getBaseTokenInfo(await getUsers(), user1SQRpProRata);

    //From signature service
    const body = {
      contractAddress: '0xd4533381d780905D24DAF0f7b8D43e58A74CDD57',
      account: '0xc109D9a3Fc3779db60af4821AE18747c708Dfcc6',
      baseAmount: 0.12345678901234567890123,
      boost: true,
      boostExchangeRate: 0.16324984234867387534523,
      transactionId: '62813e9b-bde7-40bf-adde-4cf3c3d76002+31',
    };

    const response = {
      signature:
        '0x50538e1470e11991b330b8207c1ff97f31f355a326e7c538087e942f3255c2b4491aef704565f340c7070dc86a7bbc3820adae5df472b0672d3681268b7b9d721b',
      baseAmountInWei: '123456789012345680',
      boostExchangeRateInWei: '163249842348673870',
      nonce: 12,
      timestampNow: 1720442780,
      timestampLimit: 1720443080,
      dateLimit: '2024-07-08T12:56:23.636Z',
    };

    const nonce = await user1SQRpProRata.getAccountDepositNonce(user1Address);
    const params: DepositSigParams = {
      account: body.account,
      baseAmount: toBaseTokenWei(body.baseAmount),
      nonce: Number(nonce),
      boost: true,
      boostExchangeRate: seedData.boostExchangeRate,
      transactionId: seedData.transactionId1,
      timestampLimit: seedData.nowPlus1h,
      signature: '',
    };

    params.signature = await signMessageForProRataDeposit(
      depositVerifier,
      params.account,
      params.baseAmount,
      params.boost,
      params.boostExchangeRate,
      params.nonce,
      params.transactionId,
      params.timestampLimit,
    );

    const account = body.account.toLowerCase();

    //Checks

    if (CHECK_REQUIRED) {
      if (body.account.toLowerCase() !== user1Address.toLowerCase()) {
        console.error(`Account is not correct`);
        return;
      }

      const balance = await user1BaseToken.balanceOf(account);
      console.log(`User balance: ${toNumberDecimals(balance, decimals)}`);
      if (Number(response.baseAmountInWei) > Number(balance)) {
        console.error(`User balance is lower`);
        return;
      }

      const nonce = await user1SQRpProRata.getAccountDepositNonce(body.account);
      console.log(`User nonce: ${nonce}`);
      if (response.nonce !== Number(nonce)) {
        console.error(`Nonce is not correct`);
        // return;
      }

      const signature = await signMessageForProRataDeposit(
        depositVerifier,
        account,
        BigInt(response.baseAmountInWei),
        body.boost,
        BigInt(response.boostExchangeRateInWei),
        response.nonce,
        body.transactionId,
        response.timestampLimit,
      );

      if (response.signature !== signature) {
        console.error(`Signature is not correct`);
        return;
      }
    }

    // const params = {
    //   account,
    //   baseAmount: BigInt(response.baseAmountInWei),
    //   boost: body.boost,
    //   boostExchangeRate: BigInt(response.boostExchangeRateInWei),
    //   transactionId: body.transactionId,
    //   timestampLimit: response.timestampLimit,
    //   signature: response.signature,
    // };

    // const paramsFromFront = {
    //   amount: 1,
    //   boosted: true,
    //   amountInWei: '1000000000000000000',
    //   exchangeRateInWei: '110016000000000000',
    //   contractAddress: '0xafa705d74e57f0ccfc58945ae245146aee504ccc',
    //   userId: 'f1da1dbd-d6a4-42a7-8779-ee7919376ac5',
    //   walletAddress: '0xc109d9a3fc3779db60af4821ae18747c708dfcc6',
    //   transactionId: '69e935ac-fb79-4d15-b3de-3da39e03d656',
    //   timeStampLimit: 1720711002,
    //   signature:
    //     '0x21be1dbafcd59ca19db3ed5195986240314f725f99f67942ed051b47226d0fbb564b1c0125201f08a74bc54afdc5a11ba8aaadf37fe22543ed5029a0c7ac4b601c',
    // };

    // const params = {
    //   ...paramsFromFront,
    //   boost: paramsFromFront.boosted,
    //   baseAmount: BigInt(paramsFromFront.amountInWei),
    //   boostExchangeRate: BigInt(paramsFromFront.exchangeRateInWei),
    //   timestampLimit: paramsFromFront.timeStampLimit,
    // };

    const paramsForFront: DepositSigParamsForFront = {
      ...params,
      amount: toNumberDecimalsFixed(params.baseAmount, decimals),
      contractAddress: sqrpProRataAddress,
      boosted: params.boost,
      amountInWei: String(params.baseAmount),
      exchangeRateInWei: String(params.boostExchangeRate),
      timeStampLimit: params.timestampLimit,
    };

    delete paramsForFront.boost;
    delete paramsForFront.baseAmount;
    delete paramsForFront.boostExchangeRate;
    delete paramsForFront.nonce;

    console.log(111, paramsForFront);

    return;

    const currentAllowance = await user1BaseToken.allowance(user1Address, sqrpProRataAddress);
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    if (params.baseAmount > currentAllowance) {
      const askAllowance = seedData.allowance;
      await waitTx(
        user1BaseToken.approve(sqrpProRataAddress, askAllowance, TX_OVERRIDES),
        'approve',
      );
      console.log(
        `${toNumberDecimals(askAllowance, decimals)} SQR was approved to ${sqrpProRataAddress}`,
      );
    }

    // await waitTx(user1BaseToken.approve(sqrpProRataAddress, 0n, TX_OVERRIDES), 'approve');

    console.log(params);

    console.table({
      ...params,
      amount: formatContractToken(params.baseAmount, decimals, tokenName),
      timestampLimit: formatContractDate(params.timestampLimit),
    });

    await waitTx(
      user1SQRpProRata.depositSig(
        {
          baseAmount: params.baseAmount,
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

func.tags = [`${SQR_P_PRO_RATA_NAME}:deposit-sig-manual`];

export default func;
