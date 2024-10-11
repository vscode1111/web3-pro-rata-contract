import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import dayjs, { Dayjs } from 'dayjs';
import { TransactionReceipt } from 'ethers';
import { Context } from 'mocha';
import { seedData, tokenConfig } from '~seeds';
import { ContextBase } from '~types';
import { loadFixture } from '../loadFixture';
import { deployWEB3ProRataContractFixture } from '../web3ProRata.fixture';
import { checkTotalWEB3Balance, getBaseTokenBalance, getBoostTokenBalance } from './balance';
import { WEB3ProRataFixtureParamConfig } from './types';

export function findEvent<T>(receipt: TransactionReceipt) {
  return receipt.logs.find((log: any) => log.fragment) as T;
}

export async function getChainTime() {
  const chainTime = await time.latest();
  return dayjs(chainTime * 1000);
}

export async function loadWEB3ProRataFixture(
  that: Context,
  fixtureConfig?: WEB3ProRataFixtureParamConfig,
  onNewSnapshot?: (
    chainTime: Dayjs,
    contractConfig?: WEB3ProRataFixtureParamConfig,
  ) => Promise<WEB3ProRataFixtureParamConfig | undefined>,
) {
  const fixture = await loadFixture(
    deployWEB3ProRataContractFixture,
    fixtureConfig,
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

  await checkTotalWEB3Balance(that);
}

export async function accountDepositRefundInfoZeroCheck(context: Context) {
  expect(await context.ownerWEB3ProRata.getDepositRefundAllocation(context.user1Address)).eq(
    seedData.zero,
  );
  const {
    baseDeposited: baseDeposited1,
    boosted: boosted1,
    baseAllocation: baseAllocation1,
    baseRefund: baseRefund1,
    boostRefund: boostRefund1,
    nonce: nonce1,
  } = await context.ownerWEB3ProRata.getDepositRefundAccountInfo(context.user1Address);
  expect(baseDeposited1).eq(seedData.zero);
  expect(boosted1).eq(false);
  expect(baseAllocation1).eq(seedData.zero);
  expect(baseRefund1).eq(seedData.zero);
  expect(boostRefund1).eq(seedData.zero);
  expect(nonce1).eq(0);

  expect(await context.ownerWEB3ProRata.getDepositRefundAllocation(context.user2Address)).eq(
    seedData.zero,
  );
  const {
    baseDeposited: baseDeposited2,
    boosted: boosted2,
    baseAllocation: baseAllocation2,
    baseRefund: baseRefund2,
    boostRefund: boostRefund2,
    nonce: nonce2,
  } = await context.ownerWEB3ProRata.getDepositRefundAccountInfo(context.user2Address);
  expect(baseDeposited2).eq(seedData.zero);
  expect(boosted2).eq(false);
  expect(baseAllocation2).eq(seedData.zero);
  expect(baseRefund2).eq(seedData.zero);
  expect(boostRefund2).eq(seedData.zero);
  expect(nonce2).eq(0);
}

export async function contractZeroCheck(context: Context) {
  expect(await getBaseTokenBalance(context, context.owner2Address)).eq(tokenConfig.initMint);
  expect(await getBaseTokenBalance(context, context.user1Address)).eq(seedData.zero);
  expect(await getBaseTokenBalance(context, context.user2Address)).eq(seedData.zero);
  expect(await getBaseTokenBalance(context, context.web3ProRataAddress)).eq(seedData.zero);

  expect(await getBoostTokenBalance(context, context.owner2Address)).eq(tokenConfig.initMint);
  expect(await getBoostTokenBalance(context, context.user1Address)).eq(seedData.zero);
  expect(await getBoostTokenBalance(context, context.user2Address)).eq(seedData.zero);
  expect(await getBoostTokenBalance(context, context.web3ProRataAddress)).eq(seedData.zero);

  expect(await context.owner2WEB3ProRata.getAccountCount()).eq(seedData.zero);
  expect(await context.owner2WEB3ProRata.calculateRemainDeposit()).eq(seedData.zero);
  expect(await context.owner2WEB3ProRata.calculateOverfundAmount()).eq(seedData.zero);
  expect(await context.owner2WEB3ProRata.calculateAccountBoostRefund(context.user1Address)).eq(
    seedData.zero,
  );
  expect(await context.owner2WEB3ProRata.calculateAccountBoostRefund(context.user2Address)).eq(
    seedData.zero,
  );
  expect(await context.owner2WEB3ProRata.getProcessedRefundIndex()).eq(0);
  expect(await context.owner2WEB3ProRata.getProcessedBaseSwappedIndex()).eq(0);

  await accountDepositRefundInfoZeroCheck(context);

  const { totalBaseDeposited } = await context.ownerWEB3ProRata.getDepositRefundContractInfo();
  expect(totalBaseDeposited).eq(seedData.zero);
}
