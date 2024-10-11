import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { INITIAL_POSITIVE_CHECK_TEST_TITLE } from '~common';
import { BaseContractConfigEx, contractConfig, seedData, tokenConfig } from '~seeds';
import { addSecondsToUnixTime, toBaseTokenWei } from '~utils';
import {
  checkTotalWEB3Balance,
  contractZeroCheck,
  depositSig,
  getBaseTokenBalance,
  getTestCaseContactConfig,
  loadWEB3ProRataFixture,
  transferToUserAndApproveForContract,
} from './utils';

export function shouldBehaveCorrectFundingEqualCase(): void {
  describe('funding: equal case', () => {
    const caseContractConfig: BaseContractConfigEx = {
      ...getTestCaseContactConfig(contractConfig),
      baseGoal: toBaseTokenWei(15_000),
    };

    const caseSettings = {
      deposit1: toBaseTokenWei(8_000),
      deposit2: toBaseTokenWei(7_000),
    };

    beforeEach(async function () {
      await loadWEB3ProRataFixture(this, { contractConfig: caseContractConfig });
      await checkTotalWEB3Balance(this);
    });

    afterEach(async function () {
      await checkTotalWEB3Balance(this);
    });

    it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
      await contractZeroCheck(this);

      await transferToUserAndApproveForContract(
        this,
        this.owner2BaseToken,
        this.user1BaseToken,
        this.user1Address,
        seedData.userInitBalance,
      );

      await transferToUserAndApproveForContract(
        this,
        this.owner2BaseToken,
        this.user2BaseToken,
        this.user2Address,
        seedData.userInitBalance,
      );

      const newStartDate = addSecondsToUnixTime(caseContractConfig.startDate, seedData.timeShift);
      await time.increaseTo(newStartDate);

      const timestampLimit = addSecondsToUnixTime(newStartDate, seedData.timeShift);

      await depositSig({
        context: this,
        userWEB3ProRata: this.user1WEB3ProRata,
        userAddress: this.user1Address,
        baseDeposit: caseSettings.deposit1,
        transactionId: seedData.transactionId1,
        timestampLimit,
      });

      await depositSig({
        context: this,
        userWEB3ProRata: this.user2WEB3ProRata,
        userAddress: this.user2Address,
        baseDeposit: caseSettings.deposit2,
        transactionId: seedData.transactionId2,
        timestampLimit,
      });

      expect(await getBaseTokenBalance(this, this.web3ProRataAddress)).closeTo(
        caseSettings.deposit1 + caseSettings.deposit2,
        seedData.baseBalanceDelta,
      );

      expect(await this.ownerWEB3ProRata.isReachedBaseGoal()).eq(true);

      const closeDate = addSecondsToUnixTime(caseContractConfig.closeDate, seedData.timeShift);
      await time.increaseTo(closeDate);

      expect(await this.ownerWEB3ProRata.isReachedBaseGoal()).eq(true);

      await this.owner2WEB3ProRata.refundAll();

      expect(await getBaseTokenBalance(this, this.user1Address)).closeTo(
        seedData.userInitBalance - caseSettings.deposit1,
        seedData.baseBalanceDelta,
      );
      expect(await getBaseTokenBalance(this, this.user2Address)).closeTo(
        seedData.userInitBalance - caseSettings.deposit2,
        seedData.baseBalanceDelta,
      );
      expect(await getBaseTokenBalance(this, this.web3ProRataAddress)).closeTo(
        caseContractConfig.baseGoal,
        seedData.baseBalanceDelta,
      );

      expect(await getBaseTokenBalance(this, this.owner2Address)).closeTo(
        tokenConfig.initMint - BigInt(2) * seedData.userInitBalance,
        seedData.baseBalanceDelta,
      );

      await this.owner2WEB3ProRata.withdrawBaseGoal();

      expect(await getBaseTokenBalance(this, this.web3ProRataAddress)).closeTo(
        seedData.zero,
        seedData.baseBalanceDelta,
      );
      expect(await getBaseTokenBalance(this, this.owner2Address)).closeTo(
        tokenConfig.initMint - BigInt(2) * seedData.userInitBalance + caseContractConfig.baseGoal,
        seedData.baseBalanceDelta,
      );
    });
  });
}
