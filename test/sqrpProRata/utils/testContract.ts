import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { uniqBy } from 'lodash';
import { Context } from 'mocha';
import { v4 as uuidv4 } from 'uuid';
import { bigIntSum, exist } from '~common';
import { BaseContractConfig, seedData } from '~seeds';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { addSecondsToUnixTime, signMessageForProRataDeposit } from '~utils';
import {
  calculateDecimalsFactors,
  getBalances,
  getBaseDecimals,
  getBaseTokenBalance,
  getBoostDecimals,
} from './balance';
import { contractZeroCheck } from './misc';
import {
  getDiffBalances,
  getUserEnvironment,
  printAccountInfoResults,
  printContractConfig,
  printContractResults,
  printContractStats,
  printDepositRecords,
} from './print';
import {
  AccountInfoResult,
  CaseBehaviour,
  DepositRecord,
  FormattedDepositRecord,
  UserType,
} from './types';

export async function transferToUserAndApproveForContract(
  context: Context,
  owner2ERC20Token: ERC20Token,
  userERC20Token: ERC20Token,
  userAddress: string,
  balance: bigint,
) {
  await owner2ERC20Token.transfer(userAddress, balance);
  const allowance = await userERC20Token.allowance(userAddress, context.sqrpProRataAddress);
  await userERC20Token.approve(context.sqrpProRataAddress, allowance + balance);
}

export async function depositSig({
  context,
  userSQRpProRata,
  userAddress,
  baseDeposit,
  boost = false,
  boostExchangeRate = seedData.zero,
  transactionId,
  timestampLimit,
  revertDeposit,
}: {
  context: Context;
  userSQRpProRata: SQRpProRata;
  userAddress: string;
  baseDeposit: bigint;
  boost?: boolean;
  boostExchangeRate?: bigint;
  transactionId: string;
  timestampLimit: number;
  revertDeposit?: string;
}) {
  const nonce = Number(await userSQRpProRata.getAccountDepositNonce(userAddress));

  const signature = await signMessageForProRataDeposit(
    context.owner2,
    userAddress,
    baseDeposit,
    boost,
    boostExchangeRate,
    nonce,
    transactionId,
    timestampLimit,
  );

  if (revertDeposit) {
    await expect(
      userSQRpProRata.depositSig({
        baseAmount: baseDeposit,
        boost,
        boostExchangeRate,
        transactionId,
        timestampLimit,
        signature,
      }),
    ).revertedWithCustomError(context.owner2SQRpProRata, revertDeposit);
  } else {
    await userSQRpProRata.depositSig({
      baseAmount: baseDeposit,
      boost,
      boostExchangeRate,
      transactionId,
      timestampLimit,
      signature,
    });
  }
}

export async function testContract(
  context: Context,
  contractConfig: BaseContractConfig,
  depositRecords: DepositRecord[],
  caseBehaviour?: CaseBehaviour,
) {
  console.log('----------------------------------------------------------------------------------');

  const {
    owner2Address,
    owner2SQRpProRata,
    owner2BaseToken,
    owner2BoostToken,
    sqrpProRataAddress,
    ownerSQRpProRata,
  } = context;

  const [baseDecimals, boostDecimals] = await Promise.all([
    getBaseDecimals(context),
    getBoostDecimals(context),
  ]);

  const baseBalanceDelta = caseBehaviour?.baseBalanceDelta ?? seedData.baseBalanceDelta;
  const boostBalanceDelta = caseBehaviour?.boostBalanceDelta ?? seedData.boostBalanceDelta;

  const formattedDepositRecord: FormattedDepositRecord[] = [];

  depositRecords.forEach((depositRecord) => {
    if (!depositRecord.transactionId) {
      depositRecord.transactionId = uuidv4();
    }
    if (!depositRecord.boost) {
      depositRecord.boost = false;
    }
  });

  printContractConfig({
    baseGoal: await owner2SQRpProRata.baseGoal(),
    baseDecimals,
    boostDecimals,
  });

  await contractZeroCheck(context);

  const uniqUsers = uniqBy(depositRecords, (record) => record.user).map((record) => record.user);

  for (const depositRecord of depositRecords) {
    const { user, baseDeposit } = depositRecord;

    const userEnvironment = getUserEnvironment(context, user);
    if (!userEnvironment) {
      continue;
    }

    const { userAddress, userBaseToken, userBoostToken } = userEnvironment;

    const [decimalsFactor1, decimalsFactor2] = calculateDecimalsFactors(
      baseDecimals,
      boostDecimals,
    );

    await transferToUserAndApproveForContract(
      context,
      owner2BaseToken,
      userBaseToken,
      userAddress,
      baseDeposit,
    );

    await transferToUserAndApproveForContract(
      context,
      owner2BoostToken,
      userBoostToken,
      userAddress,
      (baseDeposit * decimalsFactor1) / decimalsFactor2,
    );
  }

  const balanceTable1 = await getBalances(context);

  const newStartDate = addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift);
  await time.increaseTo(newStartDate);

  const timestampLimit = addSecondsToUnixTime(newStartDate, seedData.timeShift);

  // Deposits
  for (const depositRecord of depositRecords) {
    const { user } = depositRecord;
    const {
      baseDeposit,
      transactionId,
      boost,
      boostExchangeRate = seedData.zero,
      revertDeposit,
      expectedTotalBaseNonBoostDeposited,
      expectedTotalBaseBoostDeposited,
      expectedTotalBaseDeposited,
    } = depositRecord;

    const userEnvironment = getUserEnvironment(context, user);
    if (!userEnvironment) {
      continue;
    }

    const { userAddress, userSQRpProRata } = userEnvironment;

    if (!transactionId) {
      return;
    }

    await depositSig({
      context,
      userSQRpProRata,
      userAddress,
      baseDeposit,
      boost,
      boostExchangeRate,
      transactionId,
      timestampLimit,
      revertDeposit,
    });

    const [totalBaseNonBoostDeposited, totalBaseBoostDeposited, totalBaseDeposited] =
      await Promise.all([
        owner2SQRpProRata.totalBaseNonBoostDeposited(),
        owner2SQRpProRata.totalBaseBoostDeposited(),
        owner2SQRpProRata.totalBaseDeposited(),
      ]);

    formattedDepositRecord.push({
      ...depositRecord,
      totalBaseNonBoostDeposited,
      totalBaseBoostDeposited,
      totalBaseDeposited,
    });

    if (exist(expectedTotalBaseNonBoostDeposited)) {
      expect(totalBaseNonBoostDeposited).closeTo(
        expectedTotalBaseNonBoostDeposited,
        baseBalanceDelta,
      );
    }

    if (exist(expectedTotalBaseBoostDeposited)) {
      expect(totalBaseBoostDeposited).closeTo(expectedTotalBaseBoostDeposited, baseBalanceDelta);
    }

    if (exist(expectedTotalBaseDeposited)) {
      expect(totalBaseDeposited).closeTo(expectedTotalBaseDeposited, baseBalanceDelta);
    }
  }

  printDepositRecords(formattedDepositRecord, baseDecimals);

  if (!caseBehaviour) {
    return;
  }

  const {
    expectedRevertRefundAll,
    expectedRevertWithdrawBaseSwappedAmount,
    expectedRevertWithdrawExcessTokens,
    requiredBoostAmount,
  } = caseBehaviour;

  const totalDeposit = bigIntSum(depositRecords, (record) => record.baseDeposit);

  const shouldReachedBaseGoal = totalDeposit >= contractConfig.baseGoal;

  expect(await getBaseTokenBalance(context, sqrpProRataAddress)).closeTo(
    totalDeposit,
    baseBalanceDelta,
  );

  expect(await ownerSQRpProRata.isReachedBaseGoal()).eq(shouldReachedBaseGoal);

  const closeDate = addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift);
  await time.increaseTo(closeDate);

  expect(await ownerSQRpProRata.isReachedBaseGoal()).eq(shouldReachedBaseGoal);

  const totalBaseSwappedAmount = await ownerSQRpProRata.totalBaseSwappedAmount();

  const finalRequiredBoostAmount =
    requiredBoostAmount ?? (await ownerSQRpProRata.calculateRequiredBoostAmount());

  if (finalRequiredBoostAmount > seedData.zero) {
    await owner2BoostToken.transfer(sqrpProRataAddress, finalRequiredBoostAmount);
  }

  // await getBalances(context, baseDecimals, boostDecimals);

  if (caseBehaviour?.sendTokensToContract) {
    const { baseAmount, boostAmount } = caseBehaviour.sendTokensToContract;
    if (baseAmount) {
      await owner2BaseToken.transfer(sqrpProRataAddress, baseAmount);
    }
    if (boostAmount) {
      await owner2BoostToken.transfer(sqrpProRataAddress, boostAmount);
    }
  }

  if (caseBehaviour?.withdrawTokensFromContract) {
    const { baseAmount, boostAmount } = caseBehaviour.withdrawTokensFromContract;
    if (baseAmount) {
      const baseToken = await owner2SQRpProRata.baseToken();
      await owner2SQRpProRata.forceWithdraw(baseToken, owner2Address, baseAmount);
    }
    if (boostAmount) {
      const boostToken = await owner2SQRpProRata.boostToken();
      await owner2SQRpProRata.forceWithdraw(boostToken, owner2Address, boostAmount);
    }
  }
  const { userExpectations = {} } = caseBehaviour;

  // await getBalances(context, baseDecimals, boostDecimals);

  if (!expectedRevertRefundAll && !expectedRevertWithdrawBaseSwappedAmount) {
    const userExpectationsValues = Object.values(userExpectations);

    const totalBaseRefundUserExpectation = bigIntSum(
      userExpectationsValues,
      (result) => result.baseRefunded ?? seedData.zero,
    );

    const totalBoostRefundUserExpectation = bigIntSum(
      userExpectationsValues,
      (result) => result.boostRefunded ?? seedData.zero,
    );

    const [calculatedTotalBaseRefund, calculatedTotalBoostRefund] =
      await ownerSQRpProRata.calculateTotalRefundTokensAll();

    expect(calculatedTotalBaseRefund).closeTo(totalBaseRefundUserExpectation, baseBalanceDelta);
    expect(calculatedTotalBoostRefund).closeTo(totalBoostRefundUserExpectation, boostBalanceDelta);
  }

  if (expectedRevertRefundAll) {
    await expect(owner2SQRpProRata.refundAll()).revertedWithCustomError(
      context.owner2SQRpProRata,
      expectedRevertRefundAll,
    );
  } else {
    await owner2SQRpProRata.refundAll();
  }

  if (shouldReachedBaseGoal) {
    await owner2SQRpProRata.withdrawBaseGoal();
  }

  if (caseBehaviour?.expectedExcessBoostAmount) {
    expect(await ownerSQRpProRata.calculateExcessBoostAmount()).eq(
      caseBehaviour?.expectedExcessBoostAmount,
    );
  }

  if (caseBehaviour?.invokeWithdrawBaseSwappedAmount) {
    if (expectedRevertWithdrawBaseSwappedAmount) {
      await expect(owner2SQRpProRata.withdrawBaseSwappedAmount()).revertedWithCustomError(
        context.owner2SQRpProRata,
        expectedRevertWithdrawBaseSwappedAmount,
      );
    } else {
      await owner2SQRpProRata.calculateBaseSwappedAmountAll();
      await owner2SQRpProRata.withdrawBaseSwappedAmount();
    }
  } else {
    if (expectedRevertWithdrawExcessTokens) {
      await expect(owner2SQRpProRata.withdrawExcessTokens()).revertedWithCustomError(
        context.owner2SQRpProRata,
        expectedRevertWithdrawExcessTokens,
      );
    } else {
      await owner2SQRpProRata.withdrawExcessTokens();
    }
  }

  const accountInfoResults: AccountInfoResult[] = [];

  for (const uniqUser of uniqUsers) {
    const user = uniqUser as UserType;
    const userEnvironment = getUserEnvironment(context, user);
    if (!userEnvironment) {
      continue;
    }

    const { userAddress } = userEnvironment;

    const {
      baseDeposited,
      baseDeposit,
      baseAllocation,
      baseRefund,
      baseRefunded,
      boostDeposit,
      boostRefund,
      boostRefunded,
      nonce,
      boosted,
      boostAverageExchangeRate,
      share,
    } = await owner2SQRpProRata.fetchAccountInfo(userAddress);

    accountInfoResults.push({
      user,
      baseDeposited,
      baseDeposit,
      baseAllocation,
      baseRefund,
      baseRefunded,
      boostDeposit,
      boostRefund,
      boostRefunded,
      nonce,
      boosted,
      boostAverageExchangeRate,
      share,
    });
  }

  const totalBaseAllocation = bigIntSum(accountInfoResults, (result) => result.baseAllocation);
  const totalBaseRefund = bigIntSum(accountInfoResults, (result) => result.baseRefunded);
  const totalBoostRefund = bigIntSum(accountInfoResults, (result) => result.boostRefunded);

  // Account infos:
  printAccountInfoResults(accountInfoResults, baseDecimals, boostDecimals);

  const balanceTable2 = await getBalances(context);

  printContractResults({
    totalBaseAllocation,
    totalBaseRefund,
    totalBoostRefund,
    baseDecimals,
    boostDecimals,
  });

  printContractStats({
    totalDeposited: await owner2SQRpProRata.totalBaseDeposited(),
    totalBaseNonBoostDeposited: await owner2SQRpProRata.totalBaseNonBoostDeposited(),
    totalBaseBoostDeposited: await owner2SQRpProRata.totalBaseBoostDeposited(),
    totalBaseSwappedAmount,
    requiredBoostAmount: finalRequiredBoostAmount,
    baseDecimals,
    boostDecimals,
  });

  //Account diff balances:
  const diffBalances = getDiffBalances(balanceTable1, balanceTable2, baseDecimals, boostDecimals);

  if (!caseBehaviour) {
    return;
  }

  for (const userKey of Object.keys(userExpectations)) {
    const user = userKey as UserType;
    const userExpectation = userExpectations[user];

    if (!userExpectation) {
      continue;
    }

    const {
      baseDeposited: expectedBaseDeposited,
      baseAllocation: expectedBaseAllocation,
      baseDeposit: expectedBaseDeposit,
      baseRefund: expectedBaseRefund,
      baseRefunded: expectedBaseRefunded,
      boostDeposit: expectedBoostDeposit,
      boostRefund: expectedBoostRefund,
      boostRefunded: expectedBoostRefunded,
      nonce: expectedNonce,
      boosted: expectedBoosted,
      boostAverageExchangeRate: expectedBoostAverageExchangeRate,
      diffBaseBalance: expectedDiffBaseBalance,
      diffBoostBalance: expectedDiffBoostBalance,
    } = userExpectation;

    const userEnvironment = getUserEnvironment(context, user);
    if (userEnvironment) {
      const { userAddress } = userEnvironment;

      const {
        baseDeposited,
        baseAllocation,
        baseDeposit,
        baseRefund,
        baseRefunded,
        boostDeposit,
        boostRefund,
        boostRefunded,
        nonce,
        boosted,
        boostAverageExchangeRate,
      } = await owner2SQRpProRata.fetchAccountInfo(userAddress);

      if (exist(expectedBaseDeposited)) {
        expect(baseDeposited).closeTo(expectedBaseDeposited, baseBalanceDelta);
      }
      if (exist(expectedBaseAllocation)) {
        expect(baseAllocation).closeTo(expectedBaseAllocation, baseBalanceDelta);
      }

      if (exist(expectedBaseDeposit)) {
        expect(baseDeposit).closeTo(expectedBaseDeposit, baseBalanceDelta);
      }
      if (exist(expectedBaseRefund)) {
        expect(baseRefund).closeTo(expectedBaseRefund, baseBalanceDelta);
      }
      if (exist(expectedBaseRefunded)) {
        expect(baseRefunded).closeTo(expectedBaseRefunded, baseBalanceDelta);
      }

      if (exist(expectedBoostDeposit)) {
        expect(boostDeposit).closeTo(expectedBoostDeposit, boostBalanceDelta);
      }
      if (exist(expectedBoostRefund)) {
        expect(boostRefund).closeTo(expectedBoostRefund, boostBalanceDelta);
      }
      if (exist(expectedBoostRefunded)) {
        expect(boostRefunded).closeTo(expectedBoostRefunded, boostBalanceDelta);
      }

      if (exist(expectedNonce)) {
        expect(nonce).eq(expectedNonce);
      }
      if (exist(expectedBoosted)) {
        expect(boosted).eq(expectedBoosted);
      }
      if (exist(expectedBoostAverageExchangeRate)) {
        expect(boostAverageExchangeRate).closeTo(
          expectedBoostAverageExchangeRate,
          seedData.weiDelta,
        );
      }
    }

    const { baseBalance: diffBaseBalance, boostBalance: diffBoostBalance } = diffBalances[user];

    if (exist(expectedDiffBaseBalance)) {
      expect(diffBaseBalance).closeTo(expectedDiffBaseBalance, baseBalanceDelta);
    }
    if (exist(expectedDiffBoostBalance)) {
      expect(diffBoostBalance).closeTo(expectedDiffBoostBalance, boostBalanceDelta);
    }
  }
}
