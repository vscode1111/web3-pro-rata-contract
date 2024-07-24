import { expect } from 'chai';
import { Numeric } from 'ethers';
import { Context } from 'mocha';
import { bigIntSum, toNumberDecimalsFixed } from '~common';
import { seedData } from '~seeds';
import { ContextBase } from '~types';
import { getUserContractEnvironmentMap } from './print';
import { PrintUserInfo, UserInfos, UserType } from './types';

export async function getBaseTokenBalance(that: ContextBase, address: string) {
  return that.owner2BaseToken.balanceOf(address);
}

export async function getBaseDecimals(that: ContextBase) {
  return that.owner2BaseToken.decimals();
}

export async function getBoostTokenBalance(that: ContextBase, address: string) {
  return that.owner2BoostToken.balanceOf(address);
}

export async function getBoostDecimals(that: ContextBase) {
  return that.owner2BoostToken.decimals();
}

export async function checkTotalSQRBalance(that: ContextBase) {
  expect(
    await getTotalSQRBalance(that, [
      that.user1Address,
      that.user2Address,
      that.user3Address,
      that.ownerAddress,
      that.owner2Address,
      that.depositVerifierAddress,
      that.baseTokenAddress,
      that.sqrpProRataAddress,
    ]),
  ).eq(seedData.totalAccountBalance);
}

export async function getTotalSQRBalance(that: ContextBase, accounts: string[]): Promise<bigint> {
  const result = await Promise.all(accounts.map((address) => getBaseTokenBalance(that, address)));
  return bigIntSum(result);
}

export function printUserInfos(
  userInfos: UserInfos,
  baseDecimals: Numeric,
  boostDecimals: Numeric,
) {
  const printUserInfos: PrintUserInfo[] = [];

  for (const userKey of Object.keys(userInfos)) {
    const user = userKey as UserType;
    const { baseBalance, boostBalance } = userInfos[user];
    printUserInfos.push({
      user,
      baseBalance: toNumberDecimalsFixed(baseBalance, baseDecimals),
      boostBalance: toNumberDecimalsFixed(boostBalance, boostDecimals),
    });
  }

  console.table(printUserInfos);
}

export async function getBalances(
  context: Context,
  baseDecimals?: Numeric,
  boostDecimals?: Numeric,
): Promise<UserInfos> {
  const print = baseDecimals && boostDecimals;

  if (print) {
    console.log(
      `Account balances (base decimals: ${baseDecimals}, boost decimals: ${boostDecimals}):`,
    );
  }

  const userInfos: UserInfos = {} as any;

  const userContractEnvironmentMap = getUserContractEnvironmentMap(context);
  for (const userKey of Object.keys(userContractEnvironmentMap)) {
    const user = userKey as UserType;

    const { address } = userContractEnvironmentMap[user];

    const [baseBalance, boostBalance] = await Promise.all([
      getBaseTokenBalance(context, address),
      getBoostTokenBalance(context, address),
    ]);

    userInfos[user] = {
      baseBalance,
      boostBalance,
    };
  }

  if (print) {
    printUserInfos(userInfos, baseDecimals, boostDecimals);
  }

  return userInfos;
}

export function calculateDecimalsFactors(
  baseDecimals: bigint,
  boostDecimals: bigint,
): [bigint, bigint] {
  if (baseDecimals >= boostDecimals) {
    return [BigInt(1), BigInt(10 ** Number(baseDecimals - boostDecimals))];
  } else {
    return [BigInt(10 ** Number(boostDecimals - baseDecimals)), BigInt(1)];
  }
}
