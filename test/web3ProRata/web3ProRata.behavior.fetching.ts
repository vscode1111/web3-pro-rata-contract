import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { CONTRACT_NAME, CONTRACT_VERSION } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { addSecondsToUnixTime } from '~utils';
import {
  accountDepositRefundInfoZeroCheck,
  getBaseTokenBalance,
  loadWEB3ProRataFixture,
} from './utils';

export function shouldBehaveCorrectFetching(): void {
  describe('fetching', () => {
    beforeEach(async function () {
      await loadWEB3ProRataFixture(this);
    });

    it('should be correct init values', async function () {
      expect(await this.ownerWEB3ProRata.owner()).eq(this.owner2Address);
      expect(await this.ownerWEB3ProRata.getContractName()).eq(CONTRACT_NAME);
      expect(await this.ownerWEB3ProRata.getContractVersion()).eq(CONTRACT_VERSION);
      expect(await this.ownerWEB3ProRata.getBaseGoal()).eq(await this.ownerWEB3ProRata.baseGoal());
      expect(await this.ownerWEB3ProRata.getStartDate()).eq(
        await this.ownerWEB3ProRata.startDate(),
      );
      expect(await this.ownerWEB3ProRata.getCloseDate()).eq(
        await this.ownerWEB3ProRata.closeDate(),
      );
      expect(await this.ownerWEB3ProRata.baseToken()).eq(this.baseTokenAddress);
      expect(await this.ownerWEB3ProRata.isBeforeStartDate()).eq(true);
      expect(await this.ownerWEB3ProRata.isAfterCloseDate()).eq(false);
      expect(await this.ownerWEB3ProRata.isDepositReady()).eq(false);
      expect(await this.ownerWEB3ProRata.isReachedBaseGoal()).eq(false);
      expect(await this.ownerWEB3ProRata.getDepositRefundFetchReady()).eq(false);

      expect(await this.ownerWEB3ProRata.calculateRemainDeposit()).eq(seedData.zero);

      await time.increaseTo(addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift));

      expect(await this.ownerWEB3ProRata.calculateRemainDeposit()).eq(contractConfig.baseGoal);

      const { baseToken, boostToken } = await this.ownerWEB3ProRata.getDepositRefundTokensInfo();
      expect(baseToken).eq(await this.ownerWEB3ProRata.baseToken());
      expect(boostToken).eq(await this.ownerWEB3ProRata.boostToken());

      await accountDepositRefundInfoZeroCheck(this);

      expect(await this.ownerWEB3ProRata.calculateExcessBoostAmount()).eq(seedData.zero);
      const { totalBaseDeposited } = await this.ownerWEB3ProRata.getDepositRefundContractInfo();
      expect(totalBaseDeposited).eq(seedData.zero);
      expect(await this.ownerWEB3ProRata.calculateTotalRefundTokens(seedData.batchSize)).eql([
        seedData.zero,
        seedData.zero,
      ]);
    });

    it('should be correct balances', async function () {
      expect(await getBaseTokenBalance(this, this.owner2Address)).eq(seedData.totalAccountBalance);
      expect(await this.ownerWEB3ProRata.getBaseBalance()).eq(seedData.zero);
      expect(await this.ownerWEB3ProRata.totalBaseDeposited()).eq(seedData.zero);
      expect(await this.ownerWEB3ProRata.totalBaseNonBoostDeposited()).eq(seedData.zero);
      expect(await this.ownerWEB3ProRata.totalBaseBoostDeposited()).eq(seedData.zero);
      expect(await this.ownerWEB3ProRata.totalBaseRefunded()).eq(seedData.zero);
      expect(await this.ownerWEB3ProRata.totalBaseWithdrew()).eq(seedData.zero);
    });
  });
}
