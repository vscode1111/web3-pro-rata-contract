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

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is depositing...`);
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, sqrpProRataAddress);
    const {
      depositVerifier: verifier,
      user1Address,
      user2BaseToken,
      user1SQRpProRata,
      sqrpProRataFactory,
    } = context;

    const { decimals, tokenName } = await getTokenInfo(await getUsers(), user1SQRpProRata);

    const currentAllowance = await user2BaseToken.allowance(user1Address, sqrpProRataAddress);
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    //From Postman
    const body = {
      contractAddress: '0xb33CA002BfAA37CC98Daa6eDc39D9DCBD937873d',
      account: '0xc109D9a3Fc3779db60af4821AE18747c708Dfcc6',
      baseAmount: 0.123456789,
      boost: true,
      boostExchangeRate: 0.163,
      transactionId: '62813e9b-bde7-40bf-adde-4cf3c3d76002+25',
    };

    const response = {
      signature:
        '0xc6ffdbf29dfcf62357ad4a0879830ea9c3683c35261ff4cd455ba3381399a3f10e20cac1a9c236c5d81746cae5ddb4593c27a0443c4d87e101c6a2e3229fca581c',
      baseAmountInWei: '123456789000000000',
      boostExchangeRateInWei: '163000000000000000',
      nonce: 4,
      timestampNow: 1720015898,
      timestampLimit: 1720016198,
      dateLimit: '2024-07-03T14:21:39.305Z',
    };

    //Checks
    const account = body.account.toLowerCase();

    if (body.account.toLowerCase() !== user1Address.toLowerCase()) {
      console.error(`Account is not correct`);
      return;
    }

    const balance = await user2BaseToken.balanceOf(account);
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
      verifier,
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

    const params = {
      account,
      baseAmount: BigInt(response.baseAmountInWei),
      boost: body.boost,
      boostExchangeRate: BigInt(response.boostExchangeRateInWei),
      transactionId: body.transactionId,
      timestampLimit: response.timestampLimit,
      signature: response.signature,
    };

    if (params.baseAmount > currentAllowance) {
      const askAllowance = seedData.allowance;
      await waitTx(
        user2BaseToken.approve(sqrpProRataAddress, askAllowance, TX_OVERRIDES),
        'approve',
      );
      console.log(
        `${toNumberDecimals(askAllowance, decimals)} SQR was approved to ${sqrpProRataAddress}`,
      );
    }

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

func.tags = [`${SQR_P_PRO_RATA_NAME}:deposit-sig1-manual`];

export default func;
