import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import dayjs, { Dayjs } from 'dayjs';
import { TransactionReceipt } from 'ethers';
import { Context } from 'mocha';
import { seedData, tokenConfig } from '~seeds';
import { ContextBase } from '~types';
import { loadFixture } from '../loadFixture';
import { deploySQRpProRataContractFixture } from '../sqrpProRata.fixture';
import { checkTotalSQRBalance, getBaseTokenBalance, getBoostTokenBalance } from './balance';
import { SQRpProRataFixtureParamConfig } from './types';

export function findEvent<T>(receipt: TransactionReceipt) {
  return receipt.logs.find((log: any) => log.fragment) as T;
}

export async function getChainTime() {
  const chainTime = await time.latest();
  return dayjs(chainTime * 1000);
}

export async function loadSQRpProRataFixture(
  that: Context,
  fixtureConfig?: SQRpProRataFixtureParamConfig,
  onNewSnapshot?: (
    chainTime: Dayjs,
    contractConfig?: SQRpProRataFixtureParamConfig,
  ) => Promise<SQRpProRataFixtureParamConfig | undefined>,
) {
  const fixture = await loadFixture(
    deploySQRpProRataContractFixture,
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

  await checkTotalSQRBalance(that);
}

export async function contractZeroCheck(context: Context) {
  expect(await getBaseTokenBalance(context, context.owner2Address)).eq(tokenConfig.initMint);
  expect(await getBaseTokenBalance(context, context.user1Address)).eq(seedData.zero);
  expect(await getBaseTokenBalance(context, context.user2Address)).eq(seedData.zero);
  expect(await getBaseTokenBalance(context, context.sqrpProRataAddress)).eq(seedData.zero);

  expect(await getBoostTokenBalance(context, context.owner2Address)).eq(tokenConfig.initMint);
  expect(await getBoostTokenBalance(context, context.user1Address)).eq(seedData.zero);
  expect(await getBoostTokenBalance(context, context.user2Address)).eq(seedData.zero);
  expect(await getBoostTokenBalance(context, context.sqrpProRataAddress)).eq(seedData.zero);

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
