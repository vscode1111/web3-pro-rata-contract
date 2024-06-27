import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import dayjs, { Dayjs } from 'dayjs';
import { Numeric, TransactionReceipt } from 'ethers';
import { uniqBy } from 'lodash';
import { Context } from 'mocha';
import { v4 as uuidv4 } from 'uuid';
import { bigIntSum, formatToken, toNumberFixed } from '~common';
import { ContractConfig, seedData, tokenConfig } from '~seeds';
import { BaseToken } from '~typechain-types/contracts/BaseToken';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { ContextBase } from '~types';
import { addSecondsToUnixTime, signMessageForProRataDeposit } from '~utils';
import { loadFixture } from './loadFixture';
import { deploySQRpProRataContractFixture } from './sqrpProRata.fixture';
import { CaseExpectations, DepositRecord, DepositResult, UserEnvironment, UserType } from './types';

export async function getBaseTokenBalance(that: ContextBase, address: string) {
  return that.owner2BaseToken.balanceOf(address);
}

export async function checkTotalSQRBalance(that: ContextBase) {
  expect(
    await getTotalSQRBalance(that, [
      that.user1Address,
      that.user2Address,
      that.user3Address,
      that.ownerAddress,
      that.owner2Address,
      that.verifierAddress,
      that.baseTokenAddress,
      that.sqrpProRataAddress,
    ]),
  ).eq(seedData.totalAccountBalance);
}

export async function getTotalSQRBalance(that: ContextBase, accounts: string[]): Promise<bigint> {
  const result = await Promise.all(accounts.map((address) => getBaseTokenBalance(that, address)));
  return bigIntSum(result);
}

export function findEvent<T>(receipt: TransactionReceipt) {
  return receipt.logs.find((log: any) => log.fragment) as T;
}

export async function getChainTime() {
  const chainTime = await time.latest();
  return dayjs(chainTime * 1000);
}

export async function loadSQRpProRataFixture(
  that: Context,
  contractConfig?: Partial<ContractConfig>,
  onNewSnapshot?: (
    chainTime: Dayjs,
    contractConfig?: Partial<ContractConfig | undefined>,
  ) => Promise<Partial<ContractConfig> | undefined>,
) {
  const fixture = await loadFixture(
    deploySQRpProRataContractFixture,
    contractConfig,
    async (config) => {
      const chainTime = await getChainTime();
      const newConfig = await onNewSnapshot?.(chainTime, config);
      return {
        ...config,
        ...newConfig,
      };
    },
  );

  for (const field in fixture) {
    that[field] = fixture[field as keyof ContextBase];
  }

  await checkTotalSQRBalance(that);
}

export async function contractZeroCheck(context: Context) {
  expect(await getBaseTokenBalance(context, context.owner2Address)).eq(tokenConfig.initMint);
  expect(await getBaseTokenBalance(context, context.user1Address)).eq(seedData.zero);
  expect(await getBaseTokenBalance(context, context.user2Address)).eq(seedData.zero);
  expect(await getBaseTokenBalance(context, context.sqrpProRataAddress)).eq(seedData.zero);

  expect(await context.owner2SQRpProRata.getAccountCount()).eq(seedData.zero);
  expect(await context.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);
  expect(await context.owner2SQRpProRata.calculateOverfundAmount()).eq(seedData.zero);
  expect(await context.owner2SQRpProRata.calculateAccountBoostRefund(context.user1Address)).eq(
    seedData.zero,
  );
  expect(await context.owner2SQRpProRata.calculateAccountBoostRefund(context.user2Address)).eq(
    seedData.zero,
  );
  expect(await context.owner2SQRpProRata.getProcessedAccountIndex()).eq(0);

  expect(await context.ownerSQRpProRata.getAccountDepositAmount(context.user1Address)).eq(
    seedData.zero,
  );
  expect(await context.ownerSQRpProRata.getAccountDepositAmount(context.user2Address)).eq(
    seedData.zero,
  );
  expect(await context.ownerSQRpProRata.getTotalDeposited()).eq(seedData.zero);
}

export async function transferToUserAndApproveForContract(
  context: Context,
  userBaseToken: BaseToken,
  userAddress: string,
  balance: bigint,
) {
  await context.owner2BaseToken.transfer(userAddress, balance);
  const allowance = await userBaseToken.allowance(userAddress, context.sqrpProRataAddress);
  await userBaseToken.approve(context.sqrpProRataAddress, allowance + balance);
}

export async function depositSig({
  context,
  userSQRpProRata,
  userAddress,
  baseDeposit,
  boost = false,
  boostRatio = seedData.zero,
  transactionId,
  timestampLimit,
}: {
  context: Context;
  userSQRpProRata: SQRpProRata;
  userAddress: string;
  baseDeposit: bigint;
  boost?: boolean;
  boostRatio?: bigint;
  transactionId: string;
  timestampLimit: number;
}) {
  const nonce = Number(await userSQRpProRata.getAccountDepositNonce(userAddress));

  const signature = await signMessageForProRataDeposit(
    context.owner2,
    userAddress,
    baseDeposit,
    boost,
    boostRatio,
    nonce,
    transactionId,
    timestampLimit,
  );

  await userSQRpProRata.depositSig(
    baseDeposit,
    boost,
    boostRatio,
    transactionId,
    timestampLimit,
    signature,
  );
}

export function printContractConfig({
  baseGoal,
  decimals,
}: {
  baseGoal: bigint;
  decimals: Numeric;
}) {
  console.log(`Goal: ${formatToken(baseGoal, decimals)}`);
}

export function printContractStats({
  totalDeposited,
  totalBaseNonBoostDeposited,
  totalBaseBoostDeposited,
  decimals,
}: {
  totalDeposited: bigint;
  totalBaseNonBoostDeposited: bigint;
  totalBaseBoostDeposited: bigint;
  decimals: Numeric;
}) {
  console.log(
    `Total deposited: ${formatToken(totalDeposited, decimals)}, non-boost deposited: ${formatToken(totalBaseNonBoostDeposited, decimals)}, boost deposited: ${formatToken(totalBaseBoostDeposited, decimals)}`,
  );
}

export function getUserEnvironment(context: Context, user: UserType): UserEnvironment {
  const addressMap: Record<UserType, UserEnvironment> = {
    user1: {
      userAddress: context.user1Address,
      userBaseToken: context.user1BaseToken,
      userSQRpProRata: context.user1SQRpProRata,
    },
    user2: {
      userAddress: context.user2Address,
      userBaseToken: context.user2BaseToken,
      userSQRpProRata: context.user2SQRpProRata,
    },
    user3: {
      userAddress: context.user3Address,
      userBaseToken: context.user3BaseToken,
      userSQRpProRata: context.user3SQRpProRata,
    },
  };

  return addressMap[user];
}

export function printDepositRecords(depositRecords: DepositRecord[], decimals: Numeric) {
  console.log('Deposits:');
  const printTable = depositRecords.map(({ user, baseDeposit, boost = false }) => ({
    user,
    baseDeposit: Number(formatToken(baseDeposit, decimals)),
    boost,
  }));
  console.table(printTable);
}

export function printDepositResults(depositResults: DepositResult[], decimals: Numeric) {
  console.log('Account infos:');

  const fractionDigits = 3;

  const printTable = depositResults.map(
    ({
      user,
      baseDeposited,
      boosted,
      baseAllocation,
      baseDeposit,
      baseRefund,
      baseRefunded,
      boostDeposit,
      boostRefund,
      boostRefunded,
      nonce,
      boostAverageRate,
    }) => ({
      user,
      baseDeposited: toNumberFixed(formatToken(baseDeposited, decimals), fractionDigits),
      boosted,
      baseAllocation: toNumberFixed(formatToken(baseAllocation, decimals), fractionDigits),
      baseDeposit: toNumberFixed(formatToken(baseDeposit, decimals), fractionDigits),
      baseRefund: toNumberFixed(formatToken(baseRefund, decimals), fractionDigits),
      baseRefunded: toNumberFixed(formatToken(baseRefunded, decimals), fractionDigits),
      boostDeposit: toNumberFixed(formatToken(boostDeposit, decimals), fractionDigits),
      boostRefund: toNumberFixed(formatToken(boostRefund, decimals), fractionDigits),
      boostRefunded: toNumberFixed(formatToken(boostRefunded, decimals), fractionDigits),
      nonce: Number(nonce),
      boostAverageRate: toNumberFixed(formatToken(boostAverageRate), fractionDigits),
    }),
  );
  console.table(printTable);
}

export function printContractResults({
  totalAllocation,
  totalRefund,
  decimals,
}: {
  totalAllocation: bigint;
  totalRefund: bigint;
  decimals: Numeric;
}) {
  console.log(
    `Total allocations: ${formatToken(totalAllocation, decimals)}, total refund: ${formatToken(totalRefund, decimals)}`,
  );
}

export async function checkDepositRecords(
  context: Context,
  contractConfig: ContractConfig,
  depositRecords: DepositRecord[],
  // userExpectations?: Partial<Record<UserType, UserExpectation>>,
  caseExpectations?: CaseExpectations,
) {
  console.log('----------------------------------------------------------------------------------');

  const decimals = await context.owner2BaseToken.decimals();
  printContractConfig({ baseGoal: await context.owner2SQRpProRata.baseGoal(), decimals });
  printDepositRecords(depositRecords, decimals);

  await contractZeroCheck(context);

  const depositResults: DepositResult[] = [];

  const uniqUsers = uniqBy(depositRecords, (record) => record.user).map((record) => record.user);

  for (const depositRecord of depositRecords) {
    const { baseDeposit: deposit } = depositRecord;
    const { userAddress, userBaseToken } = getUserEnvironment(context, depositRecord.user);
    await transferToUserAndApproveForContract(context, userBaseToken, userAddress, deposit);
  }

  const newStartDate = addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift);
  await time.increaseTo(newStartDate);

  const timestampLimit = addSecondsToUnixTime(newStartDate, seedData.timeShift);

  for (const depositRecord of depositRecords) {
    const {
      baseDeposit,
      transactionId = uuidv4(),
      boost,
      boostRatio = seedData.zero,
    } = depositRecord;
    const { userAddress, userSQRpProRata } = getUserEnvironment(context, depositRecord.user);

    await depositSig({
      context,
      userSQRpProRata,
      userAddress,
      baseDeposit,
      boost,
      boostRatio,
      transactionId,
      timestampLimit,
    });
  }

  const totalDeposit = bigIntSum(depositRecords, (record) => record.baseDeposit);

  const shouldReachedBaseGoal = totalDeposit >= contractConfig.baseGoal;

  expect(await getBaseTokenBalance(context, context.sqrpProRataAddress)).closeTo(
    totalDeposit,
    seedData.balanceDelta,
  );

  expect(await context.ownerSQRpProRata.isReachedBaseGoal()).eq(shouldReachedBaseGoal);

  const closeDate = addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift);
  await time.increaseTo(closeDate);

  expect(await context.ownerSQRpProRata.isReachedBaseGoal()).eq(shouldReachedBaseGoal);

  await context.owner2SQRpProRata.refundAll();

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
    } = await context.owner2SQRpProRata.fetchAccountInfo(userAddress);

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
    });
  }

  printDepositResults(depositResults, decimals);
  printContractStats({
    totalDeposited: await context.owner2SQRpProRata.totalBaseDeposited(),
    totalBaseNonBoostDeposited: await context.owner2SQRpProRata.totalBaseNonBoostDeposited(),
    totalBaseBoostDeposited: await context.owner2SQRpProRata.totalBaseBoostDeposited(),
    decimals,
  });
  printContractResults({
    totalAllocation: bigIntSum(depositResults, (result) => result.baseAllocation),
    totalRefund: bigIntSum(depositResults, (result) => result.baseRefunded),
    decimals,
  });

  if (!caseExpectations?.userExpectations) {
    return;
  }

  const { userExpectations } = caseExpectations;

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

    // const filteredResults = depositRecords.filter((result) => result.user === userKey);
    // const totalRecordDeposit = bigIntSum(filteredResults, (result) => result.deposit);
    // expect(await getBaseTokenBalance(context, userAddress)).closeTo(
    //   seedData.userInitBalance - totalRecordDeposit,
    //   seedData.balanceDelta,
    // );

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
    } = await context.owner2SQRpProRata.fetchAccountInfo(userAddress);

    if (expectedBaseDeposited) {
      // expect(baseDeposited).eq(expectedBaseDeposited);
      expect(baseDeposited).closeTo(expectedBaseDeposited, seedData.balanceDelta);
    }
    if (expectedBaseAllocation) {
      expect(baseAllocation).eq(expectedBaseAllocation);
    }

    if (expectedBaseDeposit) {
      expect(baseDeposit).eq(expectedBaseDeposit);
    }
    if (expectedBaseRefund) {
      expect(baseRefund).eq(expectedBaseRefund);
    }
    if (expectedBaseRefunded) {
      expect(baseRefunded).eq(expectedBaseRefunded);
    }

    if (expectedBoostDeposit) {
      expect(boostDeposit).eq(expectedBoostDeposit);
    }
    if (expectedBoostRefund) {
      expect(boostRefund).eq(expectedBoostRefund);
    }
    if (expectedBoostRefunded) {
      expect(boostRefunded).eq(expectedBoostRefunded);
    }

    if (expectedNonce) {
      expect(nonce).eq(expectedNonce);
    }
    if (expectedBoosted) {
      expect(boosted).eq(expectedBoosted);
    }
    if (expectedBoostAverageRate) {
      expect(boostAverageRate).closeTo(expectedBoostAverageRate, seedData.weiDelta);
    }
  }

  // const userCount = uniqUsers.length;

  // expect(await getBaseTokenBalance(context, context.owner2Address)).closeTo(
  //   tokenConfig.initMint - BigInt(userCount) * seedData.userInitBalance,
  //   seedData.balanceDelta,
  // );
  // expect(await getBaseTokenBalance(context, context.sqrpProRataAddress)).closeTo(
  //   shouldReachedBaseGoal ? contractConfig.baseGoal : seedData.zero,
  //   seedData.balanceDelta,
  // );
  // expect(await getBaseTokenBalance(context, context.owner2Address)).closeTo(
  //   tokenConfig.initMint - BigInt(userCount) * seedData.userInitBalance,
  //   seedData.balanceDelta,
  // );
}
