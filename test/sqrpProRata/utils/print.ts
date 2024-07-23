import { Numeric } from 'ethers';
import { Context } from 'mocha';
import { formatToken, toNumberDecimals, toNumberDecimalsFixed } from '~common';
import { printUserInfos } from './balance';
import {
  AccountInfoResult,
  FormattedDepositRecord,
  UserContractEnvironment,
  UserEnvironment,
  UserInfos,
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
  totalBaseSwappedAmount,
  requiredBoostAmount,
  baseDecimals,
  boostDecimals,
}: {
  totalDeposited: bigint;
  totalBaseNonBoostDeposited: bigint;
  totalBaseBoostDeposited: bigint;
  totalBaseSwappedAmount: bigint;
  requiredBoostAmount: bigint;
  baseDecimals: Numeric;
  boostDecimals: Numeric;
}) {
  console.log(
    `Total deposited: ${toNumberDecimalsFixed(totalDeposited, baseDecimals)}, non-boost deposited: ${toNumberDecimalsFixed(totalBaseNonBoostDeposited, baseDecimals)}, boost deposited: ${toNumberDecimalsFixed(totalBaseBoostDeposited, baseDecimals)}`,
  );
  console.log(
    `Swapped base: ${toNumberDecimalsFixed(totalBaseSwappedAmount, baseDecimals)}, required boost: ${toNumberDecimalsFixed(requiredBoostAmount, boostDecimals)}, `,
  );
}

export function getUserEnvironmentMap(
  context: Context,
): Partial<Record<UserType, UserEnvironment>> {
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
): Record<UserType, UserContractEnvironment> {
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

export function getUserEnvironment(context: Context, user: UserType): UserEnvironment | undefined {
  return getUserEnvironmentMap(context)[user];
}

export function printDepositRecords(depositRecords: FormattedDepositRecord[], decimals: Numeric) {
  console.log('Deposits:');
  const formattedTable = depositRecords.map(
    ({
      user,
      baseDeposit,
      transactionId,
      boost,
      boostExchangeRate,
      totalBaseNonBoostDeposited,
      totalBaseBoostDeposited,
      totalBaseDeposited,
    }) => ({
      user,
      baseDeposit: Number(formatToken(baseDeposit, decimals)),
      transactionId,
      boost,
      boostExchangeRate: boostExchangeRate ? toNumberDecimals(boostExchangeRate) : 0,
      totalBaseNonBoostDeposited: Number(formatToken(totalBaseNonBoostDeposited, decimals)),
      totalBaseBoostDeposited: Number(formatToken(totalBaseBoostDeposited, decimals)),
      totalBaseDeposited: Number(formatToken(totalBaseDeposited, decimals)),
    }),
  );
  console.table(formattedTable);
}

export function printAccountInfoResults(
  accountInfoResults: AccountInfoResult[],
  baseDecimals: Numeric,
  boostDecimals: Numeric,
) {
  console.log('Account infos:');

  const formattedTable = accountInfoResults.map(
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
      boostAverageExchangeRate,
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
      boostAverageExchangeRate: toNumberDecimalsFixed(boostAverageExchangeRate, undefined),
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

export function getDiffBalances(
  userInfos1: UserInfos,
  userInfos2: UserInfos,
  baseDecimals?: Numeric,
  boostDecimals?: Numeric,
): UserInfos {
  console.log(`Account diff balances:`);

  const diffUserInfos: UserInfos = {} as any;

  for (const userKey of Object.keys(userInfos1)) {
    const user = userKey as UserType;
    const userInfoValue1 = userInfos1[user];
    const userInfoValue2 = userInfos2[user];
    diffUserInfos[user] = {
      baseBalance: userInfoValue2.baseBalance - userInfoValue1.baseBalance,
      boostBalance: userInfoValue2.boostBalance - userInfoValue1.boostBalance,
    };
  }

  if (baseDecimals && boostDecimals) {
    printUserInfos(diffUserInfos, baseDecimals, boostDecimals);
  }

  return diffUserInfos;
}
