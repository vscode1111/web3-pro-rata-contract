import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { VERSION } from '~constants';
import { contractConfig, seedData } from '~seeds';
import { addSecondsToUnixTime } from '~utils';
import { getERC20TokenBalance, loadSQRpProRataFixture } from './utils';

export function shouldBehaveCorrectFetching(): void {
  describe('fetching', () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this);
    });

    it('should be correct init values', async function () {
      expect(await this.ownerSQRpProRata.owner()).eq(this.owner2Address);
      expect(await this.ownerSQRpProRata.VERSION()).eq(VERSION);
      expect(await this.ownerSQRpProRata.erc20Token()).eq(this.erc20TokenAddress);
      expect(await this.ownerSQRpProRata.coldWallet()).eq(this.coldWalletAddress);
      expect(await this.ownerSQRpProRata.balanceLimit()).eq(contractConfig.balanceLimit);

      expect(await this.ownerSQRpProRata.isTooEarly()).eq(true);
      expect(await this.ownerSQRpProRata.isTooLate()).eq(false);
      expect(await this.ownerSQRpProRata.isReady()).eq(false);

      expect(await this.ownerSQRpProRata.calculateRemainDeposit()).eq(seedData.zero);
      expect(await this.ownerSQRpProRata.calculateRemainWithdraw()).eq(seedData.zero);

      await time.increaseTo(addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift));

      expect(await this.ownerSQRpProRata.calculateRemainDeposit()).eq(
        contractConfig.depositGoal,
      );
      expect(await this.ownerSQRpProRata.calculateRemainWithdraw()).eq(
        contractConfig.withdrawGoal,
      );
    });

    it('should be correct balances', async function () {
      expect(await getERC20TokenBalance(this, this.owner2Address)).eq(seedData.totalAccountBalance);
      expect(await this.ownerSQRpProRata.getBalance()).eq(seedData.zero);
      expect(await this.ownerSQRpProRata.totalDeposited()).eq(seedData.zero);
      expect(await this.ownerSQRpProRata.totalWithdrew()).eq(seedData.zero);
    });
  });
}
