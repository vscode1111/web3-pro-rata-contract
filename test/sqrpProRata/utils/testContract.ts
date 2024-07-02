import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { uniqBy } from 'lodash';
import { Context } from 'mocha';
import { v4 as uuidv4 } from 'uuid';
import { bigIntSum, exist } from '~common';
import { ContractConfig, seedData } from '~seeds';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { addSecondsToUnixTime, signMessageForProRataDeposit } from '~utils';
import { getBalances, getBaseDecimals, getBaseTokenBalance, getBoostDecimals } from './balance';
import { contractZeroCheck } from './misc';
import {
  getUserEnvironment,
  printContractConfig,
  printContractResults,
  printContractStats,
  printDepositRecords,
  printDepositResults,
  printDiffBalances,
} from './print';
import { CaseExpectation, DepositRecord, DepositResult, UserType } from './types';

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
  boostRate = seedData.zero,
  transactionId,
  timestampLimit,
}: {
  context: Context;
  userSQRpProRata: SQRpProRata;
  userAddress: string;
  baseDeposit: bigint;
  boost?: boolean;
  boostRate?: bigint;
  transactionId: string;
  timestampLimit: number;
}) {
  const nonce = Number(await userSQRpProRata.getAccountDepositNonce(userAddress));

  const signature = await signMessageForProRataDeposit(
    context.owner2,
    userAddress,
    baseDeposit,
    boost,
    boostRate,
    nonce,
    transactionId,
    timestampLimit,
  );

  await userSQRpProRata.depositSig({
    baseAmount: baseDeposit,
    boost,
    boostRate,
    transactionId,
    timestampLimit,
    signature,
  });
}

export async function testContract(
  context: Context,
  contractConfig: ContractConfig,
  depositRecords: DepositRecord[],
  caseExpectation?: CaseExpectation,
) {
  console.log('----------------------------------------------------------------------------------');

  const {
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

  const baseBalanceDelta = caseExpectation?.baseBalanceDelta ?? seedData.baseBalanceDelta;
  const boostBalanceDelta = caseExpectation?.boostBalanceDelta ?? seedData.boostBalanceDelta;

  depositRecords.forEach((record) => {
    if (!record.transactionId) {
      record.transactionId = uuidv4();
    }
    if (!record.boost) {
      record.boost = false;
    }
  });

  printContractConfig({
    baseGoal: await owner2SQRpProRata.baseGoal(),
    baseDecimals,
    boostDecimals,
  });
  printDepositRecords(depositRecords, baseDecimals);

  await contractZeroCheck(context);

  const depositResults: DepositResult[] = [];

  const uniqUsers = uniqBy(depositRecords, (record) => record.user).map((record) => record.user);

  for (const depositRecord of depositRecords) {
    const { user, baseDeposit } = depositRecord;
    const { userAddress, userBaseToken, userBoostToken } = getUserEnvironment(context, user);
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
      baseDeposit,
    );
  }

  const balanceTable1 = await getBalances(context, baseDecimals, boostDecimals);

  const newStartDate = addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift);
  await time.increaseTo(newStartDate);

  const timestampLimit = addSecondsToUnixTime(newStartDate, seedData.timeShift);

  for (const depositRecord of depositRecords) {
    const { baseDeposit, transactionId, boost, boostRate = seedData.zero } = depositRecord;
    const { userAddress, userSQRpProRata } = getUserEnvironment(context, depositRecord.user);

    if (!transactionId) {
      return;
    }

    await depositSig({
      context,
      userSQRpProRata,
      userAddress,
      baseDeposit,
      boost,
      boostRate: boostRate,
      transactionId,
      timestampLimit,
    });
  }

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

  const requiredBoostAmount = await ownerSQRpProRata.calculatedRequiredBoostAmount();
  const baseSwappedAmount = await ownerSQRpProRata.calculatedBaseSwappedAmount();

  expect(await ownerSQRpProRata.calculateExcessBoostAmount()).eq(seedData.zero);

  await owner2BoostToken.transfer(sqrpProRataAddress, requiredBoostAmount);

  await owner2SQRpProRata.refundAll();

  if (shouldReachedBaseGoal) {
    await owner2SQRpProRata.withdrawBaseGoal();
  }

  // await owner2SQRpProRata.withdrawBaseSwappedAmount();

  await owner2SQRpProRata.withdrawExcessTokens();

  for (const uniqUser of uniqUsers) {
    const user = uniqUser as UserType;
    const { userAddress } = getUserEnvironment(context, user);

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
      boostAverageRate,
      share,
    } = await owner2SQRpProRata.fetchAccountInfo(userAddress);

    depositResults.push({
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
      boostAverageRate,
      share,
    });
  }

  printDepositResults(depositResults, baseDecimals, boostDecimals);

  const balanceTable2 = await getBalances(context, baseDecimals, boostDecimals);

  printContractResults({
    totalBaseAllocation: bigIntSum(depositResults, (result) => result.baseAllocation),
    totalBaseRefund: bigIntSum(depositResults, (result) => result.baseRefunded),
    totalBoostRefund: bigIntSum(depositResults, (result) => result.boostRefunded),
    baseDecimals,
    boostDecimals,
  });

  printContractStats({
    totalDeposited: await owner2SQRpProRata.totalBaseDeposited(),
    totalBaseNonBoostDeposited: await owner2SQRpProRata.totalBaseNonBoostDeposited(),
    totalBaseBoostDeposited: await owner2SQRpProRata.totalBaseBoostDeposited(),
    baseSwappedAmount,
    requiredBoostAmount,
    baseDecimals,
    boostDecimals,
  });

  printDiffBalances(balanceTable1, balanceTable2);

  if (!caseExpectation?.userExpectations) {
    return;
  }

  const { userExpectations } = caseExpectation;

  if (!userExpectations) {
    return;
  }

  for (const userKey of Object.keys(userExpectations ?? {})) {
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
      boostAverageRate: expectedBoostAverageRate,
    } = userExpectation;
    const { userAddress } = getUserEnvironment(context, user);

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
      boostAverageRate,
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
    if (exist(expectedBoostAverageRate)) {
      expect(boostAverageRate).closeTo(expectedBoostAverageRate, seedData.weiDelta);
    }
  }

  // const userCount = uniqUsers.length;

  // expect(await getBaseTokenBalance(context, owner2Address)).closeTo(
  //   tokenConfig.initMint - BigInt(userCount) * seedData.userInitBalance,
  //   seedData.balanceDelta,
  // );
  // expect(await getBaseTokenBalance(context, sqrpProRataAddress)).closeTo(
  //   shouldReachedBaseGoal ? contractConfig.baseGoal : seedData.zero,
  //   seedData.balanceDelta,
  // );
  // expect(await getBaseTokenBalance(context, owner2Address)).closeTo(
  //   tokenConfig.initMint - BigInt(userCount) * seedData.userInitBalance,
  //   seedData.balanceDelta,
  // );
}
