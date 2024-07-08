import { toUnixTime, toWei } from '~common';
import { ContractConfig, contractConfig, now } from '~seeds';
import { checkTotalSQRBalance, loadSQRpProRataFixture, testContract } from './utils';

export const BASE_DECIMALS = 8;
export const BOOST_DECIMALS = 4;

const caseContractConfig: ContractConfig = {
  ...contractConfig,
  baseGoal: toWei(100, BASE_DECIMALS),
  baseDecimals: BASE_DECIMALS,
  boostDecimals: BOOST_DECIMALS,
  startDate: toUnixTime(now.add(40, 'days').toDate()),
  closeDate: toUnixTime(now.add(42, 'days').toDate()),
};

export function shouldBehaveCorrectFundingDifferentDecimalsCase1(): void {
  describe(`funding: base decimals: ${BASE_DECIMALS}, boost decimals: ${BOOST_DECIMALS} case`, () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this, {
        //RATE_PRECISION
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
            },
          },
          baseBalanceDelta: toWei(0.001, BASE_DECIMALS),
          boostBalanceDelta: toWei(0.0001, BOOST_DECIMALS),
        },
      );
    });
  });
}
