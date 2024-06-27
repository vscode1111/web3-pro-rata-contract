import { toUnixTime, toWei } from '~common';
import { ContractConfig, contractConfig, now, seedData } from '~seeds';
import { toContractWei } from '~utils';
import { checkDepositRecords, checkTotalSQRBalance, loadSQRpProRataFixture } from './utils';

const caseContractConfig: ContractConfig = {
  ...contractConfig,
  baseGoal: toContractWei(100),
  startDate: toUnixTime(now.add(30, 'days').toDate()),
  closeDate: toUnixTime(now.add(32, 'days').toDate()),
};

export function shouldBehaveCorrectFundingBaseCase(): void {
  describe('funding: different positive cases', () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this, caseContractConfig);
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it('3 simple deposits, unreached goal', async function () {
      await checkDepositRecords(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toContractWei(10),
          },
          {
            user: 'user2',
            baseDeposit: toContractWei(20),
          },
          {
            user: 'user3',
            baseDeposit: toContractWei(30),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseDeposited: toContractWei(10),
              baseAllocation: toContractWei(0),
              baseDeposit: toContractWei(10),
              baseRefund: toContractWei(10),
              baseRefunded: toContractWei(10),
              boostDeposit: toContractWei(0),
              boostRefund: toContractWei(0),
              boostRefunded: toContractWei(0),
              nonce: 1,
              boosted: false,
            },
            user2: {
              baseDeposited: toContractWei(20),
              baseAllocation: toContractWei(0),
              baseDeposit: toContractWei(20),
              baseRefund: toContractWei(20),
              baseRefunded: toContractWei(20),
              boostDeposit: toContractWei(0),
              boostRefund: toContractWei(0),
              boostRefunded: toContractWei(0),
              nonce: 1,
              boosted: false,
            },
            user3: {
              baseDeposited: toContractWei(30),
              baseAllocation: toContractWei(0),
              baseDeposit: toContractWei(30),
              baseRefund: toContractWei(30),
              baseRefunded: toContractWei(30),
              boostDeposit: toContractWei(0),
              boostRefund: toContractWei(0),
              boostRefunded: toContractWei(0),
              nonce: 1,
              boosted: false,
            },
          },
        },
      );
    });

    it('3 simple deposits, exact reached goal', async function () {
      await checkDepositRecords(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toContractWei(20),
          },
          {
            user: 'user2',
            baseDeposit: toContractWei(30),
          },
          {
            user: 'user3',
            baseDeposit: toContractWei(50),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toContractWei(20),
              baseRefunded: toContractWei(0),
            },
            user2: {
              baseAllocation: toContractWei(30),
              baseRefunded: toContractWei(0),
            },
            user3: {
              baseAllocation: toContractWei(50),
              baseRefunded: toContractWei(0),
            },
          },
        },
      );
    });

    it('1 extra simple, 1 simple, 1 extra simple + simple', async function () {
      await checkDepositRecords(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toContractWei(200),
          },
          {
            user: 'user2',
            baseDeposit: toContractWei(60),
          },
          {
            user: 'user3',
            baseDeposit: toContractWei(100),
          },
          {
            user: 'user3',
            baseDeposit: toContractWei(40),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toContractWei(50),
              baseRefunded: toContractWei(150),
            },
            user2: {
              baseAllocation: toContractWei(15),
              baseRefunded: toContractWei(45),
            },
            user3: {
              baseAllocation: toContractWei(35),
              baseRefunded: toContractWei(0),
            },
          },
        },
      );
    });

    it('3 boost deposits, exact reached goal', async function () {
      await checkDepositRecords(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toContractWei(20),
            boost: true,
            boostRatio: seedData.boostRatio,
          },
          {
            user: 'user2',
            baseDeposit: toContractWei(30),
            boost: true,
            boostRatio: seedData.boostRatio,
          },
          {
            baseDeposit: toContractWei(50),
            user: 'user3',
            boost: true,
            boostRatio: seedData.boostRatio,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toContractWei(20),
              baseRefunded: toContractWei(0),
            },
            user2: {
              baseAllocation: toContractWei(30),
              baseRefunded: toContractWei(0),
            },
            user3: {
              baseAllocation: toContractWei(50),
              baseRefunded: toContractWei(0),
            },
          },
        },
      );
    });

    it('1 extra simple, 1 simple, 1 boost', async function () {
      await checkDepositRecords(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toContractWei(150),
          },
          {
            user: 'user2',
            baseDeposit: toContractWei(60),
          },
          {
            user: 'user3',
            baseDeposit: toContractWei(30),
            boost: true,
            boostRatio: seedData.boostRatio,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toContractWei(50),
              baseRefunded: toContractWei(100),
              boostRefunded: toContractWei(0),
            },
            user2: {
              baseAllocation: toContractWei(20),
              baseRefunded: toContractWei(40),
              boostRefunded: toContractWei(0),
            },
            user3: {
              baseAllocation: toContractWei(30),
              baseRefunded: toContractWei(0),
              boostRefunded: toContractWei(0),
            },
          },
        },
      );
    });

    it('1 extra simple, 1 extra boost, 1 boost', async function () {
      await checkDepositRecords(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toContractWei(200),
          },
          {
            user: 'user2',
            baseDeposit: toContractWei(270),
            boost: true,
            boostRatio: seedData.boostRatio,
          },
          {
            user: 'user3',
            baseDeposit: toContractWei(30),
            boost: true,
            boostRatio: seedData.boostRatio,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toContractWei(0),
              baseRefunded: toContractWei(200),
            },
            user2: {
              baseAllocation: toContractWei(90),
              baseRefunded: toContractWei(0),
              boostRefunded: toContractWei(180),
            },
            user3: {
              baseAllocation: toContractWei(10),
              baseRefunded: toContractWei(0),
              boostRefunded: toContractWei(20),
            },
          },
        },
      );
    });

    it('2 simple boost from one user', async function () {
      await checkDepositRecords(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toContractWei(70),
            boost: true,
            boostRatio: toWei(0.2),
          },
          {
            user: 'user1',
            baseDeposit: toContractWei(60),
            boost: true,
            boostRatio: toWei(0.3),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseDeposited: toContractWei(130),
              baseAllocation: toContractWei(100),
              baseDeposit: toContractWei(0),
              baseRefund: toContractWei(0),
              baseRefunded: toContractWei(0),
              boostDeposit: toContractWei(550),
              // boostRefund: toContractWei(126.923),
              // boostRefunded: toContractWei(126.923),
              nonce: 2,
              boosted: true,
              boostAverageRate: toWei(0.236),
            },
          },
        },
      );
    });
  });
}
