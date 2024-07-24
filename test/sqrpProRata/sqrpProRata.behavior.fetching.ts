import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { CONTRACT_NAME, CONTRACT_VERSION } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { addSecondsToUnixTime } from '~utils';
import {
  accountDepositRefundInfoZeroCheck,
  getBaseTokenBalance,
  loadSQRpProRataFixture,
} from './utils';

export function shouldBehaveCorrectFetching(): void {
  describe('fetching', () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this);
    });

    it('should be correct init values', async function () {
      expect(await this.ownerSQRpProRata.owner()).eq(this.owner2Address);
      expect(await this.ownerSQRpProRata.getContractName()).eq(CONTRACT_NAME);
      expect(await this.ownerSQRpProRata.getContractVersion()).eq(CONTRACT_VERSION);
      expect(await this.ownerSQRpProRata.getBaseGoal()).eq(await this.ownerSQRpProRata.baseGoal());
      expect(await this.ownerSQRpProRata.getStartDate()).eq(
        await this.ownerSQRpProRata.startDate(),
      );
      expect(await this.ownerSQRpProRata.getCloseDate()).eq(
        await this.ownerSQRpProRata.closeDate(),
      );
      expect(await this.ownerSQRpProRata.baseToken()).eq(this.baseTokenAddress);
      expect(await this.ownerSQRpProRata.isBeforeStartDate()).eq(true);
      expect(await this.ownerSQRpProRata.isAfterCloseDate()).eq(false);
      expect(await this.ownerSQRpProRata.isDepositReady()).eq(false);
      expect(await this.ownerSQRpProRata.isReachedBaseGoal()).eq(false);
      expect(await this.ownerSQRpProRata.getDepositRefundFetchReady()).eq(false);

      expect(await this.ownerSQRpProRata.calculateRemainDeposit()).eq(seedData.zero);

      await time.increaseTo(addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift));

      expect(await this.ownerSQRpProRata.calculateRemainDeposit()).eq(contractConfig.baseGoal);

      const { baseToken, boostToken } = await this.ownerSQRpProRata.getDepositRefundTokensInfo();
      expect(baseToken).eq(await this.ownerSQRpProRata.baseToken());
      expect(boostToken).eq(await this.ownerSQRpProRata.boostToken());

      await accountDepositRefundInfoZeroCheck(this);

      expect(await this.ownerSQRpProRata.calculateExcessBoostAmount()).eq(seedData.zero);
      const { totalBaseDeposited } = await this.ownerSQRpProRata.getDepositRefundContractInfo();
      expect(totalBaseDeposited).eq(seedData.zero);
    });

    it('should be correct balances', async function () {
      expect(await getBaseTokenBalance(this, this.owner2Address)).eq(seedData.totalAccountBalance);
      expect(await this.ownerSQRpProRata.getBaseBalance()).eq(seedData.zero);
      expect(await this.ownerSQRpProRata.totalBaseDeposited()).eq(seedData.zero);
      expect(await this.ownerSQRpProRata.totalBaseNonBoostDeposited()).eq(seedData.zero);
      expect(await this.ownerSQRpProRata.totalBaseBoostDeposited()).eq(seedData.zero);
      expect(await this.ownerSQRpProRata.totalBaseRefunded()).eq(seedData.zero);
      expect(await this.ownerSQRpProRata.totalBaseWithdrew()).eq(seedData.zero);
    });
  });
}
