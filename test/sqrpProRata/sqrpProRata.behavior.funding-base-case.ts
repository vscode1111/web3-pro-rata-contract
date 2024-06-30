import { toUnixTime, toWei } from '~common';
import { ContractConfig, contractConfig, now, seedData } from '~seeds';
import { toBaseTokenWei } from '~utils';
import { checkTotalSQRBalance, loadSQRpProRataFixture, testContract } from './utils';

const caseContractConfig: ContractConfig = {
  ...contractConfig,
  baseGoal: toBaseTokenWei(100),
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
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(10),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(20),
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(30),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseDeposited: toBaseTokenWei(10),
              baseAllocation: toBaseTokenWei(0),
              baseDeposit: toBaseTokenWei(10),
              baseRefund: toBaseTokenWei(10),
              baseRefunded: toBaseTokenWei(10),
              boostDeposit: toBaseTokenWei(0),
              boostRefund: toBaseTokenWei(0),
              boostRefunded: toBaseTokenWei(0),
              nonce: 1,
              boosted: false,
            },
            user2: {
              baseDeposited: toBaseTokenWei(20),
              baseAllocation: toBaseTokenWei(0),
              baseDeposit: toBaseTokenWei(20),
              baseRefund: toBaseTokenWei(20),
              baseRefunded: toBaseTokenWei(20),
              boostDeposit: toBaseTokenWei(0),
              boostRefund: toBaseTokenWei(0),
              boostRefunded: toBaseTokenWei(0),
              nonce: 1,
              boosted: false,
            },
            user3: {
              baseDeposited: toBaseTokenWei(30),
              baseAllocation: toBaseTokenWei(0),
              baseDeposit: toBaseTokenWei(30),
              baseRefund: toBaseTokenWei(30),
              baseRefunded: toBaseTokenWei(30),
              boostDeposit: toBaseTokenWei(0),
              boostRefund: toBaseTokenWei(0),
              boostRefunded: toBaseTokenWei(0),
              nonce: 1,
              boosted: false,
            },
          },
        },
      );
    });

    it('3 simple deposits, exact reached goal', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(20),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(30),
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(50),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(20),
              baseRefunded: toBaseTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(30),
              baseRefunded: toBaseTokenWei(0),
            },
            user3: {
              baseAllocation: toBaseTokenWei(50),
              baseRefunded: toBaseTokenWei(0),
            },
          },
        },
      );
    });

    it('1 extra simple, 1 simple, 1 extra simple + simple', async function () {
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
            baseDeposit: toBaseTokenWei(60),
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(100),
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(40),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(50),
              baseRefunded: toBaseTokenWei(150),
            },
            user2: {
              baseAllocation: toBaseTokenWei(15),
              baseRefunded: toBaseTokenWei(45),
            },
            user3: {
              baseAllocation: toBaseTokenWei(35),
              baseRefunded: toBaseTokenWei(105),
            },
          },
        },
      );
    });

    it('3 boost deposits, exact reached goal', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(20),
            boost: true,
            boostRate: seedData.boostRate,
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(30),
            boost: true,
            boostRate: seedData.boostRate,
          },
          {
            baseDeposit: toBaseTokenWei(50),
            user: 'user3',
            boost: true,
            boostRate: seedData.boostRate,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(20),
              baseRefunded: toBaseTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(30),
              baseRefunded: toBaseTokenWei(0),
            },
            user3: {
              baseAllocation: toBaseTokenWei(50),
              baseRefunded: toBaseTokenWei(0),
            },
          },
        },
      );
    });

    it('1 extra simple, 1 simple, 1 boost', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(150),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(60),
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(30),
            boost: true,
            boostRate: seedData.boostRate,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(50),
              baseRefunded: toBaseTokenWei(100),
              boostRefunded: toBaseTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(20),
              baseRefunded: toBaseTokenWei(40),
              boostRefunded: toBaseTokenWei(0),
            },
            user3: {
              baseAllocation: toBaseTokenWei(30),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBaseTokenWei(0),
            },
          },
        },
      );
    });

    it('1 extra simple, 1 extra boost, 1 boost', async function () {
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
            boostRate: seedData.boostRate,
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(30),
            boost: true,
            boostRate: seedData.boostRate,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(200),
            },
            user2: {
              baseAllocation: toBaseTokenWei(90),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBaseTokenWei(180),
            },
            user3: {
              baseAllocation: toBaseTokenWei(10),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBaseTokenWei(20),
            },
          },
        },
      );
    });

    it('2 simple boost from one user', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(70),
            boost: true,
            boostRate: toWei(0.2),
          },
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(60),
            boost: true,
            boostRate: toWei(0.3),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseDeposited: toBaseTokenWei(130),
              baseAllocation: toBaseTokenWei(100),
              baseDeposit: toBaseTokenWei(0),
              baseRefund: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(0),
              boostDeposit: toBaseTokenWei(550),
              boostRefund: toBaseTokenWei(126.923),
              boostRefunded: toBaseTokenWei(126.923),
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
