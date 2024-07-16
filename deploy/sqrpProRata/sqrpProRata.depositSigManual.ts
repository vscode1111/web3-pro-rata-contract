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
  getUsers,
  signMessageForProRataDeposit,
  toBaseTokenWei,
} from '~utils';
import { deployParams } from './deployData';
import { DepositSigParams } from './types';
import { getBaseTokenInfo } from './utils';

const CHECK_REQUIRED = false;

const SIMULATE_FRONT = false;

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
      contractAddress: '0xcb40d75efe2aa43664773c0620955694096e41d7',
      account: '0xc109D9a3Fc3779db60af4821AE18747c708Dfcc6',
      // "account": "0x4Ee463d6e90764A6C34880024305C2810866432D",
      // "baseAmount": 0.012345678901234567890123,
      baseAmount: 0.01,
      boost: true,
      boostExchangeRate: 0.117729,
      transactionId: '5401177e-fb2e-4c5d-9429-19b3b351e163+1',
    };

    const response = {
      signature:
        '0x5c50e352869473e056892b51b2b43641c8f9ac4127c4f3893237f70b4789091e58702d80f83a3d2a02340cf35dbe44a91e80e4108bd142bb02f9e2db1957949e1c',
      baseAmountInWei: '10000000000000000',
      boostExchangeRateInWei: '117729000000000000',
      nonce: 9,
      timestampNow: 1721047539,
      timestampLimit: 1721047839,
      dateLimit: '2024-07-15T12:55:41.697Z',
    };

    const nonce = await user1SQRpProRata.getAccountDepositNonce(user1Address);
    let params: DepositSigParams = {
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

    if (SIMULATE_FRONT) {
      // const params = {
      //   account,
      //   baseAmount: BigInt(response.baseAmountInWei),
      //   boost: body.boost,
      //   boostExchangeRate: BigInt(response.boostExchangeRateInWei),
      //   transactionId: body.transactionId,
      //   timestampLimit: response.timestampLimit,
      //   signature: response.signature,
      // };

      const paramsFromFront = {
        amount: 0.01,
        boosted: true,
        amountInWei: '10000000000000000',
        exchangeRateInWei: '116453000000000000',
        contractAddress: '0xcb40d75efe2aa43664773c0620955694096e41d7',
        userId: 'f80f623b-4e53-4769-9fe7-93d0901c7261',
        walletAddress: '0x4ee463d6e90764a6c34880024305c2810866432d',
        transactionId: '44a309f5-e972-427d-bbf6-55ba75fffd32',
        timeStampLimit: 1721045311,
        signature:
          '0x2b3cda0274637bac4a5d239fe744f767d9125f005d108a6a313a944f213f802b314a4b4ce202eaae98266d105a3e6f85bfee355ac5b0e85d1a2438aae4ff25db1b',
      };

      params = {
        ...paramsFromFront,
        boost: paramsFromFront.boosted,
        baseAmount: BigInt(paramsFromFront.amountInWei),
        boostExchangeRate: BigInt(paramsFromFront.exchangeRateInWei),
        timestampLimit: paramsFromFront.timeStampLimit,
      } as any;

      // const paramsForFront: DepositSigParamsForFront = {
      //   ...params,
      //   amount: toNumberDecimalsFixed(params.baseAmount, decimals),
      //   contractAddress: sqrpProRataAddress,
      //   boosted: params.boost,
      //   amountInWei: String(params.baseAmount),
      //   exchangeRateInWei: String(params.boostExchangeRate),
      //   timeStampLimit: params.timestampLimit,
      // };

      // delete paramsForFront.boost;
      // delete paramsForFront.baseAmount;
      // delete paramsForFront.boostExchangeRate;
      // delete paramsForFront.nonce;

      // console.log(111, paramsForFront);

      // return;
    }

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
