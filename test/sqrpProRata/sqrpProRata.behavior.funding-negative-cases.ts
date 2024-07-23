import { ZeroAddress } from 'ethers';
import { toUnixTime } from '~common';
import { BaseContractConfigEx, contractConfig, now, seedData } from '~seeds';
import { toBaseTokenWei, toBoostTokenWei } from '~utils';
import { customError } from './testData';
import {
  checkTotalSQRBalance,
  getBaseContactConfig,
  loadSQRpProRataFixture,
  testContract,
} from './utils';

export function shouldBehaveCorrectFundingNegativeCases(): void {
  describe('funding: negative cases', () => {
    describe('case 1', () => {
      const caseContractConfig: BaseContractConfigEx = {
        ...getBaseContactConfig(contractConfig),
        baseGoal: toBaseTokenWei(100),
        startDate: toUnixTime(now.add(60, 'days').toDate()),
        closeDate: toUnixTime(now.add(62, 'days').toDate()),
      };

      beforeEach(async function () {
        await loadSQRpProRataFixture(this, { contractConfig: caseContractConfig });
        await checkTotalSQRBalance(this);
      });

      afterEach(async function () {
        await checkTotalSQRBalance(this);
      });

      it('1. throw error when exchange rate is zero', async function () {
        await testContract(this, caseContractConfig, [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(20),
            boost: true,
            revertDeposit: customError.boostExchangeRateNotZero,
          },
        ]);
      });

      it('2. throw error when user has has boosted deposit before', async function () {
        await testContract(this, caseContractConfig, [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(20),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(20),
            boost: false,
            revertDeposit: customError.userHasBoostedDeposit,
          },
        ]);
      });

      it('3. owner2 tries to call withdrawBaseSwappedAmount without calling calculateExcessBoostAmount method before', async function () {
        await testContract(
          this,
          caseContractConfig,
          [
            {
              user: 'user1',
              baseDeposit: toBaseTokenWei(200),
            },
            {
              user: 'user2',
              baseDeposit: toBaseTokenWei(270),
              boost: true,
              boostExchangeRate: seedData.boostExchangeRate,
            },
            {
              user: 'user3',
              baseDeposit: toBaseTokenWei(30),
              boost: true,
              boostExchangeRate: seedData.boostExchangeRate,
            },
          ],
          {
            invokeWithdrawBaseSwappedAmount: true,
            sendTokensToContract: {
              boostAmount: toBoostTokenWei(3456),
            },
            expectedExcessBoostAmount: toBoostTokenWei(2456),
            expectedRevertWithdrawBaseSwappedAmount: customError.notAllUsersProcessedBaseSwapped,
          },
        );
      });

      it('4. owner2 tries to call RevertRefundAll without enough base tokens', async function () {
        await testContract(
          this,
          caseContractConfig,
          [
            {
              user: 'user1',
              baseDeposit: toBaseTokenWei(200),
            },
            {
              user: 'user2',
              baseDeposit: toBaseTokenWei(270),
            },
          ],
          {
            withdrawTokensFromContract: {
              baseAmount: toBaseTokenWei(200),
            },
            requiredBoostAmount: seedData.zero,
            expectedRevertRefundAll: customError.contractHasNoEnoughBaseTokensForRefund,
            expectedRevertWithdrawExcessTokens: customError.notRefunded,
          },
        );
      });

      it('5. owner2 tries to call RevertRefundAll without enough boost tokens', async function () {
        await testContract(
          this,
          caseContractConfig,
          [
            {
              user: 'user1',
              baseDeposit: toBaseTokenWei(200),
            },
            {
              user: 'user2',
              baseDeposit: toBaseTokenWei(270),
              boost: true,
              boostExchangeRate: seedData.boostExchangeRate,
            },
          ],
          {
            requiredBoostAmount: seedData.zero,
            expectedRevertRefundAll: customError.contractHasNoEnoughBoostTokensForRefund,
            expectedRevertWithdrawExcessTokens: customError.notRefunded,
          },
        );
      });
    });
    describe('case 2', () => {
      const caseContractConfig: BaseContractConfigEx = {
        ...getBaseContactConfig(contractConfig),
        baseGoal: toBaseTokenWei(100),
        boostToken: ZeroAddress,
        startDate: toUnixTime(now.add(63, 'days').toDate()),
        closeDate: toUnixTime(now.add(65, 'days').toDate()),
      };

      beforeEach(async function () {
        await loadSQRpProRataFixture(this, { contractConfig: caseContractConfig });
        await checkTotalSQRBalance(this);
      });

      afterEach(async function () {
        await checkTotalSQRBalance(this);
      });

      it('1. throw error when base token has zero address', async function () {
        await testContract(this, caseContractConfig, [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(20),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
            revertDeposit: customError.boostTokenNotZeroAddress,
          },
        ]);
      });
    });
  });
}
