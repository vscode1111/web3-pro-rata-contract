import { Numeric } from 'ethers';
import { Context } from 'mocha';
import { formatToken, toNumberDecimals, toNumberDecimalsFixed, toNumberFixed } from '~common';
import {
  DepositRecord,
  DepositResult,
  UserContractEnvironment,
  UserContractType,
  UserEnvironment,
  UserInfo,
  UserType,
} from './types';

export function printContractConfig({
  baseGoal,
  baseDecimals,
  boostDecimals,
}: {
  baseGoal: bigint;
  baseDecimals: Numeric;
  boostDecimals: Numeric;
}) {
  console.log(`Goal: ${formatToken(baseGoal, baseDecimals)}`);
  console.log(`base decimals ${baseDecimals}, boost decimals ${boostDecimals}`);
}

export function printContractStats({
  totalDeposited,
  totalBaseNonBoostDeposited,
  totalBaseBoostDeposited,
  baseSwappedAmount,
  requiredBoostAmount,
  baseDecimals,
  boostDecimals,
}: {
  totalDeposited: bigint;
  totalBaseNonBoostDeposited: bigint;
  totalBaseBoostDeposited: bigint;
  baseSwappedAmount: bigint;
  requiredBoostAmount: bigint;
  baseDecimals: Numeric;
  boostDecimals: Numeric;
}) {
  console.log(
    `Total deposited: ${toNumberDecimalsFixed(totalDeposited, baseDecimals)}, non-boost deposited: ${toNumberDecimalsFixed(totalBaseNonBoostDeposited, baseDecimals)}, boost deposited: ${toNumberDecimalsFixed(totalBaseBoostDeposited, baseDecimals)}`,
  );
  console.log(
    `Swapped base: ${toNumberDecimalsFixed(baseSwappedAmount, baseDecimals)}, required boost: ${toNumberDecimalsFixed(requiredBoostAmount, boostDecimals)}, `,
  );
}

export function getUserEnvironmentMap(context: Context): Record<UserType, UserEnvironment> {
  return {
    user1: {
      userAddress: context.user1Address,
      userBaseToken: context.user1BaseToken,
      userBoostToken: context.user1BaseToken,
      userSQRpProRata: context.user1SQRpProRata,
    },
    user2: {
      userAddress: context.user2Address,
      userBaseToken: context.user2BaseToken,
      userBoostToken: context.user2BaseToken,
      userSQRpProRata: context.user2SQRpProRata,
    },
    user3: {
      userAddress: context.user3Address,
      userBaseToken: context.user3BaseToken,
      userBoostToken: context.user3BaseToken,
      userSQRpProRata: context.user3SQRpProRata,
    },
    // owner: {
    //   userAddress: context.ownerAddress,
    //   userBaseToken: context.ownerBaseToken,
    //   userBoostToken: context.ownerBaseToken,
    //   userSQRpProRata: context.ownerSQRpProRata,
    // },
    owner2: {
      userAddress: context.owner2Address,
      userBaseToken: context.owner2BaseToken,
      userBoostToken: context.owner2BaseToken,
      userSQRpProRata: context.owner2SQRpProRata,
    },
  };
}

export function getUserContractEnvironmentMap(
  context: Context,
): Record<UserContractType, UserContractEnvironment> {
  return {
    user1: {
      address: context.user1Address,
    },
    user2: {
      address: context.user2Address,
    },
    user3: {
      address: context.user3Address,
    },
    contract: {
      address: context.sqrpProRataAddress,
    },
    // owner: {
    //   address: context.ownerAddress,
    // },
    owner2: {
      address: context.owner2Address,
    },
  };
}

export function getUserEnvironment(context: Context, user: UserType): UserEnvironment {
  return getUserEnvironmentMap(context)[user];
}

export function printDepositRecords(depositRecords: DepositRecord[], decimals: Numeric) {
  console.log('Deposits:');
  const formattedTable = depositRecords.map(
    ({ user, baseDeposit, transactionId, boost, boostExchangeRate }) => ({
      user,
      baseDeposit: Number(formatToken(baseDeposit, decimals)),
      transactionId,
      boost,
      boostExchangeRate: boostExchangeRate ? toNumberDecimals(boostExchangeRate) : 0,
    }),
  );
  console.table(formattedTable);
}

export function printDepositResults(
  depositResults: DepositResult[],
  baseDecimals: Numeric,
  boostDecimals: Numeric,
) {
  console.log('Account infos:');

  const formattedTable = depositResults.map(
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
      share,
    }) => ({
      user,
      baseDeposited: toNumberDecimalsFixed(baseDeposited, baseDecimals),
      boosted,
      baseAllocation: toNumberDecimalsFixed(baseAllocation, baseDecimals),
      baseDeposit: toNumberDecimalsFixed(baseDeposit, baseDecimals),
      baseRefund: toNumberDecimalsFixed(baseRefund, baseDecimals),
      baseRefunded: toNumberDecimalsFixed(baseRefunded, baseDecimals),
      boostDeposit: toNumberDecimalsFixed(boostDeposit, boostDecimals),
      boostRefund: toNumberDecimalsFixed(boostRefund, boostDecimals),
      boostRefunded: toNumberDecimalsFixed(boostRefunded, boostDecimals),
      nonce: Number(nonce),
      boostAverageRate: toNumberDecimalsFixed(boostAverageRate, undefined),
      share: toNumberDecimalsFixed(share, undefined),
    }),
  );
  console.table(formattedTable);
}

export function printContractResults({
  totalBaseAllocation,
  totalBaseRefund,
  totalBoostRefund,
  baseDecimals,
  boostDecimals,
}: {
  totalBaseAllocation: bigint;
  totalBaseRefund: bigint;
  totalBoostRefund: bigint;
  baseDecimals: Numeric;
  boostDecimals: Numeric;
}) {
  console.log(
    `Account info stats: total base allocations: ${toNumberDecimalsFixed(totalBaseAllocation, baseDecimals)}, total base refund: ${toNumberDecimalsFixed(totalBaseRefund, baseDecimals)}, total boost refund: ${toNumberDecimalsFixed(totalBoostRefund, boostDecimals)}`,
  );
}

export async function printDiffBalances(userInfos1: UserInfo[], userInfos2: UserInfo[]) {
  console.log(`Account diff balances:`);

  const formattedTable: UserInfo[] = [];

  for (let i = 0; i < userInfos1.length; i++) {
    const userInfo1 = userInfos1[i];
    const userInfo2 = userInfos2[i];

    formattedTable.push({
      user: userInfo1.user,
      baseBalance: toNumberFixed(userInfo2.baseBalance - userInfo1.baseBalance),
      boostBalance: toNumberFixed(userInfo2.boostBalance - userInfo1.boostBalance),
    });
  }

  console.table(formattedTable);

  return formattedTable;
}
