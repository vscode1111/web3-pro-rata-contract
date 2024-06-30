import { expect } from 'chai';
import { Context } from 'mocha';
import { bigIntSum, toNumberDecimalsFixed } from '~common';
import { seedData } from '~seeds';
import { ContextBase } from '~types';
import { getUserContractEnvironmentMap } from './print';
import { UserInfo, UserType } from './types';

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

export async function getBalances(
  context: Context,
  baseDecimals: bigint,
  boostDecimals: bigint,
  print = false,
): Promise<UserInfo[]> {
  if (print) {
    console.log(
      `Account balances (base decimals: ${baseDecimals}, boost decimals: ${boostDecimals}):`,
    );
  }

  const formattedTable: UserInfo[] = [];

  const userContractEnvironmentMap = getUserContractEnvironmentMap(context);
  for (const userKey of Object.keys(userContractEnvironmentMap)) {
    const user = userKey as UserType;

    const { address } = userContractEnvironmentMap[user];

    const [baseBalance, boostBalance] = await Promise.all([
      getBaseTokenBalance(context, address),
      getBoostTokenBalance(context, address),
    ]);

    formattedTable.push({
      user,
      baseBalance: toNumberDecimalsFixed(baseBalance, baseDecimals),
      boostBalance: toNumberDecimalsFixed(boostBalance, boostDecimals),
    });
  }

  if (print) {
    console.table(formattedTable);
  }

  return formattedTable;
}
