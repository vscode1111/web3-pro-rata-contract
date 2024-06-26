import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import dayjs, { Dayjs } from 'dayjs';
import { Numeric, TransactionReceipt } from 'ethers';
import { uniqBy } from 'lodash';
import { Context } from 'mocha';
import { bigIntSum, formatToken } from '~common';
import { ContractConfig, seedData, tokenConfig } from '~seeds';
import { BaseToken } from '~typechain-types/contracts/BaseToken';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { ContextBase } from '~types';
import { addSecondsToUnixTime, signMessageForProRataDeposit } from '~utils';
import { loadFixture } from './loadFixture';
import { deploySQRpProRataContractFixture } from './sqrpProRata.fixture';
import { DepositRecord, DepositResult } from './types';

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
  await context.owner2BaseToken.transfer(userAddress, seedData.userInitBalance);
  // await context.owner2BaseToken.transfer(userAddress, balance); //ToDo: use that in future
  await userBaseToken.approve(context.sqrpProRataAddress, balance);
}

export async function depositSig({
  context,
  userSQRpProRata,
  userAddress,
  deposit,
  boost = false,
  transactionId,
  timestampLimit: timestampLimit,
}: {
  context: Context;
  userSQRpProRata: SQRpProRata;
  userAddress: string;
  deposit: bigint;
  boost?: boolean;
  transactionId: string;
  timestampLimit: number;
}) {
  const nonce = Number(await userSQRpProRata.getAccountDepositNonce(userAddress));

  const signature = await signMessageForProRataDeposit(
    context.owner2,
    userAddress,
    deposit,
    boost,
    nonce,
    transactionId,
    timestampLimit,
  );

  await userSQRpProRata.depositSig(deposit, boost, transactionId, timestampLimit, signature);
}

export function printContractStats({
  baseGoal,
  totalDeposited,
  totalBaseNonBoostDeposited,
  totalBaseBoostDeposited,
  decimals,
}: {
  baseGoal: bigint;
  totalDeposited: bigint;
  totalBaseNonBoostDeposited: bigint;
  totalBaseBoostDeposited: bigint;
  decimals: Numeric;
}) {
  console.log(
    `Goal: ${formatToken(baseGoal, decimals)}, total deposited: ${formatToken(totalDeposited, decimals)}, non-boost deposited: ${formatToken(totalBaseNonBoostDeposited, decimals)}, boost deposited: ${formatToken(totalBaseBoostDeposited, decimals)}`,
  );
}

export function getUserName(context: Context, userAddress: string) {
  const addressMap: Record<string, string> = {
    [context.user1Address]: 'user1',
    [context.user2Address]: 'user2',
    [context.user3Address]: 'user3',
  };

  return addressMap[userAddress] ?? userAddress;
}
export function printDepositResults(
  context: Context,
  depositResults: DepositResult[],
  decimals: Numeric,
) {
  const finalTable = depositResults.map(
    ({ userAddress, deposit, allocation, refund, boost = false }) => ({
      user: getUserName(context, userAddress),
      deposit: Number(formatToken(deposit, decimals)),
      boost,
      allocation: Number(formatToken(allocation, decimals)),
      refund: Number(formatToken(refund, decimals)),
    }),
  );

  console.table(finalTable);
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
) {
  await contractZeroCheck(context);

  const depositResults: DepositResult[] = [];

  for (const { userBaseToken, userAddress, deposit } of depositRecords) {
    await transferToUserAndApproveForContract(context, userBaseToken, userAddress, deposit);
  }

  const newStartDate = addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift);
  await time.increaseTo(newStartDate);

  const timestampLimit = addSecondsToUnixTime(newStartDate, seedData.timeShift);

  for (const { userAddress, deposit, userSQRpProRata, transactionId, boost } of depositRecords) {
    await depositSig({
      context,
      userSQRpProRata,
      userAddress,
      deposit,
      boost,
      transactionId,
      timestampLimit,
    });
  }

  const totalDeposit = bigIntSum(depositRecords, (record) => record.deposit);

  const shouldReachedBaseGoal = totalDeposit >= contractConfig.baseGoal;

  expect(await getBaseTokenBalance(context, context.sqrpProRataAddress)).closeTo(
    totalDeposit,
    seedData.balanceDelta,
  );

  expect(await context.ownerSQRpProRata.isReachedBaseGoal()).eq(shouldReachedBaseGoal);

  const closeDate = addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift);
  await time.increaseTo(closeDate);

  expect(await context.ownerSQRpProRata.isReachedBaseGoal()).eq(shouldReachedBaseGoal);

  for (const { userAddress, deposit, boost, allocation, refund } of depositRecords) {
    // const localRefund = calculateAccountRefund(contractConfig.baseGoal, deposit, totalDeposit);

    const contractAllocation =
      await context.ownerSQRpProRata.calculateAccountBaseAllocation(userAddress);
    if (allocation) {
      expect(contractAllocation).eq(allocation);
    }

    const contractRefund = await context.ownerSQRpProRata.calculateAccountBaseRefund(userAddress);
    if (refund) {
      expect(contractRefund).eq(refund);
    }

    depositResults.push({
      userAddress,
      deposit,
      boost,
      allocation: contractAllocation,
      refund: contractRefund,
    });
  }

  await context.owner2SQRpProRata.refundAll();

  const uniqUserAddresses = uniqBy(depositRecords, (record) => record.userAddress).map(
    (record) => record.userAddress,
  );

  for (const uniqUserAddress of uniqUserAddresses) {
    const filteredResults = depositResults.filter(
      (result) => result.userAddress === uniqUserAddress,
    );

    const totalAllocation = bigIntSum(filteredResults, (result) => result.allocation);

    expect(await getBaseTokenBalance(context, uniqUserAddress)).closeTo(
      seedData.userInitBalance - totalAllocation,
      seedData.balanceDelta,
    );
  }

  const userCount = uniqUserAddresses.length;

  expect(await getBaseTokenBalance(context, context.owner2Address)).closeTo(
    tokenConfig.initMint - BigInt(userCount) * seedData.userInitBalance,
    seedData.balanceDelta,
  );

  expect(await getBaseTokenBalance(context, context.sqrpProRataAddress)).closeTo(
    shouldReachedBaseGoal ? contractConfig.baseGoal : seedData.zero,
    seedData.balanceDelta,
  );
  expect(await getBaseTokenBalance(context, context.owner2Address)).closeTo(
    tokenConfig.initMint - BigInt(userCount) * seedData.userInitBalance,
    seedData.balanceDelta,
  );

  const decimals = await context.owner2BaseToken.decimals();

  console.log('----------------------------------------------------------------------------------');
  printContractStats({
    baseGoal: await context.owner2SQRpProRata.baseGoal(),
    totalDeposited: await context.owner2SQRpProRata.totalBaseDeposited(),
    totalBaseNonBoostDeposited: await context.owner2SQRpProRata.totalBaseNonBoostDeposited(),
    totalBaseBoostDeposited: await context.owner2SQRpProRata.totalBaseBoostDeposited(),
    decimals,
  });
  printDepositResults(context, depositResults, decimals);
  printContractResults({
    totalAllocation: bigIntSum(depositResults, (result) => result.allocation),
    totalRefund: bigIntSum(depositResults, (result) => result.refund),
    decimals,
  });
}
