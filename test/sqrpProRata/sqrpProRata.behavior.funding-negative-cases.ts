import { ZeroAddress } from 'ethers';
import { toUnixTime } from '~common';
import { BaseContractConfigEx, contractConfig, now, seedData } from '~seeds';
import { toBaseTokenWei } from '~utils';
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
        startDate: toUnixTime(now.add(50, 'days').toDate()),
        closeDate: toUnixTime(now.add(52, 'days').toDate()),
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
    });
    describe('case 2', () => {
      const caseContractConfig: BaseContractConfigEx = {
        ...getBaseContactConfig(contractConfig),
        baseGoal: toBaseTokenWei(100),
        boostToken: ZeroAddress,
        startDate: toUnixTime(now.add(53, 'days').toDate()),
        closeDate: toUnixTime(now.add(55, 'days').toDate()),
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
