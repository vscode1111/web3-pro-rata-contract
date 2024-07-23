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

export function shouldBehaveCorrectFundingNegativeCasesExternal(): void {
  describe('funding: positive cases, external refund', () => {
    const caseContractConfig: BaseContractConfigEx = {
      ...getBaseContactConfig(contractConfig),
      baseGoal: toBaseTokenWei(100),
      startDate: toUnixTime(now.add(50, 'days').toDate()),
      closeDate: toUnixTime(now.add(52, 'days').toDate()),
      externalRefund: true,
    };

    beforeEach(async function () {
      await loadSQRpProRataFixture(this, { contractConfig: caseContractConfig });
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it('1. 1 extra simple, 1 extra boost, 1 boost. Check calculateExcessBoostAmount method', async function () {
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
          sendTokensToContract: {
            boostAmount: toBoostTokenWei(3456),
          },
          expectedRevertRefundAll: customError.contractForExternalRefund,
          expectedExcessBoostAmount: toBoostTokenWei(3456),
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-200),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(90),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-270),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user3: {
              baseAllocation: toBaseTokenWei(10),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-30),
              diffBoostBalance: toBoostTokenWei(0),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(500),
              diffBoostBalance: toBoostTokenWei(0),
            },
          },
        },
      );
    });
  });
}
