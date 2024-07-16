import { toUnixTime, toWei } from '~common';
import { BaseContractConfigEx, contractConfig, now } from '~seeds';
import {
  checkTotalSQRBalance,
  getBaseContactConfig,
  loadSQRpProRataFixture,
  testContract,
} from './utils';

export const BASE_DECIMALS = 8;
export const BOOST_DECIMALS = 4;

export function shouldBehaveCorrectFundingDifferentDecimalsCase1(): void {
  describe(`funding: different decimals, base: ${BASE_DECIMALS}, boost: ${BOOST_DECIMALS} case`, () => {
    const caseContractConfig: BaseContractConfigEx = {
      ...getBaseContactConfig(contractConfig),
      baseGoal: toWei(100, BASE_DECIMALS),
      baseDecimals: BASE_DECIMALS,
      boostDecimals: BOOST_DECIMALS,
      startDate: toUnixTime(now.add(10, 'days').toDate()),
      closeDate: toUnixTime(now.add(12, 'days').toDate()),
    };

    beforeEach(async function () {
      await loadSQRpProRataFixture(this, {
        baseTokenConfig: {
          decimals: BASE_DECIMALS,
        },
        boostTokenConfig: {
          decimals: BOOST_DECIMALS,
        },
        contractConfig: caseContractConfig,
      });
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it('2 simple boost from one user', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toWei(70, BASE_DECIMALS),
            boost: true,
            boostExchangeRate: toWei(0.2),
          },
          {
            user: 'user1',
            baseDeposit: toWei(60, BASE_DECIMALS),
            boost: true,
            boostExchangeRate: toWei(0.3),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseDeposited: toWei(130, BASE_DECIMALS),
              baseAllocation: toWei(100, BASE_DECIMALS),
              baseDeposit: toWei(0, BASE_DECIMALS),
              baseRefund: toWei(0, BASE_DECIMALS),
              baseRefunded: toWei(0, BASE_DECIMALS),
              boostDeposit: toWei(550, BOOST_DECIMALS),
              boostRefund: toWei(126.923, BOOST_DECIMALS),
              boostRefunded: toWei(126.923, BOOST_DECIMALS),
              nonce: 2,
              boosted: true,
              boostAverageExchangeRate: toWei(0.236),
              diffBaseBalance: toWei(-130, BASE_DECIMALS),
              diffBoostBalance: toWei(126.923, BOOST_DECIMALS),
            },
            owner2: {
              diffBaseBalance: toWei(130, BASE_DECIMALS),
              diffBoostBalance: toWei(-126.923, BOOST_DECIMALS),
            },
          },
          baseBalanceDelta: toWei(0.001, BASE_DECIMALS),
          boostBalanceDelta: toWei(0.0001, BOOST_DECIMALS),
        },
      );
    });
  });
}
