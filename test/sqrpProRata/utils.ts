import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import dayjs, { Dayjs } from 'dayjs';
import { TransactionReceipt } from 'ethers';
import { Context } from 'mocha';
import { ContractConfig, seedData, tokenConfig } from '~seeds';
import { BaseToken } from '~typechain-types/contracts/BaseToken';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { ContextBase } from '~types';
import { signMessageForSQRpProRataDeposit } from '~utils';
import { loadFixture } from './loadFixture';
import { deploySQRpProRataContractFixture } from './sqrpProRata.fixture';

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

  expect(await context.owner2SQRpProRata.getUserCount()).eq(seedData.zero);
  expect(await context.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);
  expect(await context.owner2SQRpProRata.calculateOverfundAmount()).eq(seedData.zero);
  expect(await context.owner2SQRpProRata.calculateAccountRefundAmount(context.user1Address)).eq(
    seedData.zero,
  );
  expect(await context.owner2SQRpProRata.calculateAccountRefundAmount(context.user2Address)).eq(
    seedData.zero,
  );
  expect(await context.owner2SQRpProRata.getProcessedUserIndex()).eq(0);

  expect(await context.ownerSQRpProRata.getDepositedAmount(context.user1Address)).eq(seedData.zero);
  expect(await context.ownerSQRpProRata.getDepositedAmount(context.user2Address)).eq(seedData.zero);
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
  const nonce = await userSQRpProRata.getDepositNonce(userAddress);

  const signature = await signMessageForSQRpProRataDeposit(
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
