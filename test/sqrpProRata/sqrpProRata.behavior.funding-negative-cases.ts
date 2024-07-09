import { toUnixTime } from '~common';
import { ContractConfig, contractConfig, now } from '~seeds';
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

    it('1. revert BoostExchangeRateNotZero error', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(20),
            boost: true,
          },
        ],
        {
          revertDeposit: customError.boostExchangeRateNotZero,
        },
      );
    });
  });
}
