import { toUnixTime } from '~common';
import { ContractConfig, contractConfig, now, seedData } from '~seeds';
import { toBaseTokenWei } from '~utils';
import { customError } from './testData';
import { checkTotalSQRBalance, loadSQRpProRataFixture, testContract } from './utils';

const caseContractConfig: ContractConfig = {
  ...contractConfig,
  baseGoal: toBaseTokenWei(100),
  startDate: toUnixTime(now.add(30, 'days').toDate()),
  closeDate: toUnixTime(now.add(32, 'days').toDate()),
};

export function shouldBehaveCorrectFundingNegativeCases(): void {
  describe('funding: different negative cases', () => {
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
}
