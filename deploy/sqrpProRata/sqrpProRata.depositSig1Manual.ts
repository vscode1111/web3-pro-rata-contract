import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, waitTx } from '~common-contract';
import { SQR_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { getAddressesFromHre, getContext, signMessageForSQRpProRataDeposit } from '~utils';
import { deployParams } from './deployData';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is depositing...`);
    const baseTokenAddress = contractConfig.baseToken;
    const context = await getContext(baseTokenAddress, sqrpProRataAddress);
    const { verifier, user1Address, user2BaseToken, user1SQRpProRata, sqrpProRataFactory } =
      context;

    const decimals = Number(await user2BaseToken.decimals());

    const currentAllowance = await user2BaseToken.allowance(user1Address, sqrpProRataAddress);
    console.log(`${toNumberDecimals(currentAllowance, decimals)} tokens was allowed`);

    //From Postman
    const body = {
      contractAddress: '0x3721B60822603fB7B13A180BC1E3eDd5330Df827',
      account: '0xc109D9a3Fc3779db60af4821AE18747c708Dfcc6',
      amount: 0.123456789,
      transactionId: '62813e9b-bde7-40bf-adde-4cf3c3d76002+24',
      boost: false,
    };

    const response = {
      signature:
        '0x5366c436d92ce544a3e9eb83ef9144a59a1bbbfcf676a246b582474976e523d436fe5fde8f430aac2d895fe95bde173de7cdde920e96f96f14e852ceba4afbc21c',
      amountInWei: '12345679',
      nonce: 1,
      timestampNow: 1717760842,
      timestampLimit: 1717761142,
      dateLimit: '2024-06-07T11:57:25.672Z',
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

    const nonce = await user1SQRpProRata.getDepositNonce(body.account);
    console.log(`User nonce: ${nonce}`);
    if (response.nonce !== Number(nonce)) {
      console.error(`Nonce is not correct`);
      // return;
    }

    const signature = await signMessageForSQRpProRataDeposit(
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

    console.table(params);

    // return;

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
