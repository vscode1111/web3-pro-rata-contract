import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import dayjs, { Dayjs } from 'dayjs';
import { Numeric, TransactionReceipt } from 'ethers';
import { uniqBy } from 'lodash';
import { Context } from 'mocha';
import { formatToken } from '~common';
import { ContractConfig, seedData, tokenConfig } from '~seeds';
import { BaseToken } from '~typechain-types/contracts/BaseToken';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { ContextBase } from '~types';
import { addSecondsToUnixTime, calculateAccountRefund, signMessageForProRataDeposit } from '~utils';
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
  return result.reduce((acc, cur) => acc + cur, seedData.zero);
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
  deposit: deposit,
  transactionId,
  timestampLimit: timestampLimit,
}: {
  context: Context;
  userSQRpProRata: SQRpProRata;
  userAddress: string;
  deposit: bigint;
  transactionId: string;
  timestampLimit: number;
}) {
  const nonce = await userSQRpProRata.getAccountDepositNonce(userAddress);

  const signature = await signMessageForProRataDeposit(
    context.owner2,
    userAddress,
    deposit,
    false,
    Number(nonce),
    transactionId,
    timestampLimit,
  );

  await userSQRpProRata.depositSig(deposit, false, transactionId, timestampLimit, signature);
}

export function printContractStats({
  totalDeposited,
  decimals,
}: {
  totalDeposited: bigint;
  decimals: Numeric;
}) {
  console.log(`Total deposited: ${formatToken(totalDeposited, decimals)}`);
}

export function printDepositResults(depositResults: DepositResult[], decimals: Numeric) {
  const finalTable = depositResults.map(({ deposit, allocation, refund }) => ({
    deposit: Number(formatToken(deposit, decimals)),
    allocation: Number(formatToken(allocation, decimals)),
    refund: Number(formatToken(refund, decimals)),
  }));

  console.table(finalTable);
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

  for (const { userAddress, deposit, userSQRpProRata, transactionId } of depositRecords) {
    await depositSig({
      context: context,
      userSQRpProRata,
      userAddress,
      deposit,
      transactionId,
      timestampLimit,
    });
  }

  const totalDeposit = depositRecords.reduce((acc, cur) => (acc += cur.deposit), BigInt(0));

  expect(await getBaseTokenBalance(context, context.sqrpProRataAddress)).closeTo(
    totalDeposit,
    seedData.balanceDelta,
  );

  expect(await context.ownerSQRpProRata.isReachedBaseGoal()).eq(true);

  const closeDate = addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift);
  await time.increaseTo(closeDate);

  expect(await context.ownerSQRpProRata.isReachedBaseGoal()).eq(true);

  for (const { userAddress, deposit, allocation, refund } of depositRecords) {
    const localRefund = calculateAccountRefund(contractConfig.baseGoal, deposit, totalDeposit);

    if (refund) {
      expect(localRefund).eq(refund);
    }

    const localAllocation = allocation ?? deposit - localRefund;
    expect(await context.ownerSQRpProRata.getAccountDepositAmount(userAddress)).eq(localAllocation);

    depositResults.push({
      userAddress,
      deposit,
      allocation: localAllocation,
      refund: localRefund,
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
    const totalAllocation = filteredResults.reduce(
      (acc, cur) => (acc += cur.allocation),
      BigInt(0),
    );

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
    contractConfig.baseGoal,
    seedData.balanceDelta,
  );
  expect(await getBaseTokenBalance(context, context.owner2Address)).closeTo(
    tokenConfig.initMint - BigInt(userCount) * seedData.userInitBalance,
    seedData.balanceDelta,
  );

  const decimals = await context.owner2BaseToken.decimals();

  printContractStats({
    totalDeposited: await context.owner2SQRpProRata.totalBaseDeposited(),
    decimals,
  });
  printDepositResults(depositResults, decimals);
}
