import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { INITIAL_POSITIVE_CHECK_TEST_TITLE, toUnixTime } from '~common';
import { ContractConfig, contractConfig, now, seedData, tokenConfig } from '~seeds';
import { addSecondsToUnixTime, toContractWei } from '~utils';
import {
  checkTotalSQRBalance,
  contractZeroCheck,
  depositSig,
  getBaseTokenBalance,
  loadSQRpProRataFixture,
  transferToUserAndApproveForContract,
} from './utils';

const caseContractConfig: ContractConfig = {
  ...contractConfig,
  baseGoal: toContractWei(15_000),
  startDate: toUnixTime(now.add(10, 'days').toDate()),
  closeDate: toUnixTime(now.add(12, 'days').toDate()),
};

const caseSettings = {
  deposit1: toContractWei(8_000),
  deposit2: toContractWei(7_000),
};

export function shouldBehaveCorrectFundingEqualCase(): void {
  describe('funding: equal case', () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this, caseContractConfig);
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
      await contractZeroCheck(this);

      await transferToUserAndApproveForContract(
        this,
        this.user1BaseToken,
        this.user1Address,
        seedData.userInitBalance,
      );

      await transferToUserAndApproveForContract(
        this,
        this.user2BaseToken,
        this.user2Address,
        seedData.userInitBalance,
      );

      const newStartDate = addSecondsToUnixTime(caseContractConfig.startDate, seedData.timeShift);
      await time.increaseTo(newStartDate);

      const timestampLimit = addSecondsToUnixTime(newStartDate, seedData.timeShift);

      await depositSig({
        context: this,
        userSQRpProRata: this.user1SQRpProRata,
        userAddress: this.user1Address,
        baseDeposit: caseSettings.deposit1,
        transactionId: seedData.transactionId1,
        timestampLimit,
      });

      await depositSig({
        context: this,
        userSQRpProRata: this.user2SQRpProRata,
        userAddress: this.user2Address,
        baseDeposit: caseSettings.deposit2,
        transactionId: seedData.transactionId2,
        timestampLimit,
      });

      expect(await getBaseTokenBalance(this, this.sqrpProRataAddress)).closeTo(
        caseSettings.deposit1 + caseSettings.deposit2,
        seedData.balanceDelta,
      );

      expect(await this.ownerSQRpProRata.isReachedBaseGoal()).eq(true);

      const closeDate = addSecondsToUnixTime(caseContractConfig.closeDate, seedData.timeShift);
      await time.increaseTo(closeDate);

      expect(await this.ownerSQRpProRata.isReachedBaseGoal()).eq(true);

      await this.owner2SQRpProRata.refundAll();

      expect(await getBaseTokenBalance(this, this.user1Address)).closeTo(
        seedData.userInitBalance - caseSettings.deposit1,
        seedData.balanceDelta,
      );
      expect(await getBaseTokenBalance(this, this.user2Address)).closeTo(
        seedData.userInitBalance - caseSettings.deposit2,
        seedData.balanceDelta,
      );
      expect(await getBaseTokenBalance(this, this.sqrpProRataAddress)).closeTo(
        caseContractConfig.baseGoal,
        seedData.balanceDelta,
      );

      expect(await getBaseTokenBalance(this, this.owner2Address)).closeTo(
        tokenConfig.initMint - BigInt(2) * seedData.userInitBalance,
        seedData.balanceDelta,
      );

      await this.owner2SQRpProRata.withdrawGoal();

      expect(await getBaseTokenBalance(this, this.sqrpProRataAddress)).closeTo(
        seedData.zero,
        seedData.balanceDelta,
      );
      expect(await getBaseTokenBalance(this, this.owner2Address)).closeTo(
        tokenConfig.initMint - BigInt(2) * seedData.userInitBalance + caseContractConfig.baseGoal,
        seedData.balanceDelta,
      );
    });
  });
}
