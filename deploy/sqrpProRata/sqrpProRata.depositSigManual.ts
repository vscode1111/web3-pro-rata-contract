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
import { deployParams } from './deployData';
import { getTokenInfo } from './utils';

const CHECK_REQUIRED = false;

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is depositing...`);
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, sqrpProRataAddress);
    const { depositVerifier, user1Address, user1BaseToken, user1SQRpProRata, sqrpProRataFactory } =
      context;

    const { decimals, tokenName } = await getTokenInfo(await getUsers(), user1SQRpProRata);

    //From signature service
    const body = {
      contractAddress: '0x8B5c0b1b6aEA174c56ec0D4f02207DA0AAfcAA63',
      account: '0x4Ee463d6e90764A6C34880024305C2810866432D',
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

    //Checks

    if (CHECK_REQUIRED) {
      const account = body.account.toLowerCase();

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

    const params = {
      baseAmount: 500000000000000000000000n,
      boost: true,
      boostExchangeRate: 130224000000000000n,
      signature:
        '0x995ae9240648301e31f1683a9413dc671987f1e73d376edcad37eada1a214ba44ef3d1699b32667a38035384a67c4d963e96489a04aaa5f29d6ec252ea3298bb1c',
      timestampLimit: 1720446390,
      transactionId: '1523b02d-6b59-44fa-8347-b5530ec0b3d6',
    };

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
