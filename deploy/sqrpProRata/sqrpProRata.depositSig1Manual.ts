import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, printDate, printToken, waitTx } from '~common-contract';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { getAddressesFromHre, getContext, getUsers, signMessageForProRataDeposit } from '~utils';
import { deployParams } from './deployData';
import { getTokenInfo } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is depositing...`);
    const baseTokenAddress = contractConfig.baseToken;
    const context = await getContext(baseTokenAddress, sqrpProRataAddress);
    const { verifier, user1Address, user2BaseToken, user1SQRpProRata, sqrpProRataFactory } =
      context;

    const { decimals, tokenName } = await getTokenInfo(await getUsers(), user1SQRpProRata);

    const currentAllowance = await user2BaseToken.allowance(user1Address, sqrpProRataAddress);
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    //From Postman
    const body = {
      contractAddress: '0x5Ef6854EeA6eBdEaC4840a249df638d03ad0A426',
      account: '0xc109D9a3Fc3779db60af4821AE18747c708Dfcc6',
      amount: 0.123456789,
      transactionId: '62813e9b-bde7-40bf-adde-4cf3c3d76002+25',
      boost: false,
    };

    const response = {
      signature:
        '0x386ce0fdf3276585b4ad80824b229fac333e19deb2ca34a8dd6b804dbc0b660438959bec3c9beba1c39904be2d6713930aa60c4e93eb68b8ab952ba5b1ddce801b',
      amountInWei: '12345679',
      nonce: 1,
      timestampNow: 1718637791,
      timestampLimit: 1718638091,
      dateLimit: '2024-06-17T15:33:16.798Z',
    };

    //Checks
    const account = body.account.toLowerCase();

    if (body.account.toLowerCase() !== user1Address.toLowerCase()) {
      console.error(`Account is not correct`);
      return;
    }

    const balance = await user2BaseToken.balanceOf(account);
    console.log(`User balance: ${toNumberDecimals(balance, decimals)}`);
    if (Number(response.amountInWei) > Number(balance)) {
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
      BigInt(response.amountInWei),
      false,
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
      amount: BigInt(response.amountInWei),
      transactionId: body.transactionId,
      timestampLimit: response.timestampLimit,
      signature: response.signature,
    };

    if (params.amount > currentAllowance) {
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
      amount: printToken(params.amount, decimals, tokenName),
      timestampLimit: printDate(params.timestampLimit),
    });

    await waitTx(
      user1SQRpProRata.depositSig(
        params.amount,
        false,
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

func.tags = [`${SQR_P_PRO_RATA_NAME}:deposit-sig1-manual`];

export default func;
