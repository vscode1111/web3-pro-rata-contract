import { toUnixTime, toWei } from '~common';
import { ContractConfig, contractConfig, now, seedData } from '~seeds';
import { toBaseTokenWei, toBoostTokenWei } from '~utils';
import { checkTotalSQRBalance, loadSQRpProRataFixture, testContract } from './utils';

const caseContractConfig: ContractConfig = {
  ...contractConfig,
  baseGoal: toBaseTokenWei(100),
  startDate: toUnixTime(now.add(30, 'days').toDate()),
  closeDate: toUnixTime(now.add(32, 'days').toDate()),
};

export function shouldBehaveCorrectFundingPositiveCases(): void {
  describe('funding: different positive cases', () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this, { contractConfig: caseContractConfig });
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it('1. 3 simple deposits, unreached goal', async function () {
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
          excessBoostAmount: toBoostTokenWei(0),
          userExpectations: {
            user1: {
              baseDeposited: toBaseTokenWei(10),
              baseAllocation: toBaseTokenWei(0),
              baseDeposit: toBaseTokenWei(10),
              baseRefund: toBaseTokenWei(10),
              baseRefunded: toBaseTokenWei(10),
              boostDeposit: toBaseTokenWei(0),
              boostRefund: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(0),
              nonce: 1,
              boosted: false,
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseDeposited: toBaseTokenWei(20),
              baseAllocation: toBaseTokenWei(0),
              baseDeposit: toBaseTokenWei(20),
              baseRefund: toBaseTokenWei(20),
              baseRefunded: toBaseTokenWei(20),
              boostDeposit: toBaseTokenWei(0),
              boostRefund: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(0),
              nonce: 1,
              boosted: false,
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user3: {
              baseDeposited: toBaseTokenWei(30),
              baseAllocation: toBaseTokenWei(0),
              baseDeposit: toBaseTokenWei(30),
              baseRefund: toBaseTokenWei(30),
              baseRefunded: toBaseTokenWei(30),
              boostDeposit: toBaseTokenWei(0),
              boostRefund: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(0),
              nonce: 1,
              boosted: false,
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
          },
        },
      );
    });

    it('2. 3 simple deposits, exact reached goal', async function () {
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
              diffBaseBalance: toBaseTokenWei(-20),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(30),
              baseRefunded: toBaseTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-30),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user3: {
              baseAllocation: toBaseTokenWei(50),
              baseRefunded: toBaseTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-50),
              diffBoostBalance: toBoostTokenWei(0),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(100),
              diffBoostBalance: toBoostTokenWei(0),
            },
          },
        },
      );
    });

    it('3. 1 extra simple, 1 simple, 1 extra simple + simple', async function () {
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
              diffBaseBalance: toBaseTokenWei(-50),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(15),
              baseRefunded: toBaseTokenWei(45),
              diffBaseBalance: toBaseTokenWei(-15),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user3: {
              baseAllocation: toBaseTokenWei(35),
              baseRefunded: toBaseTokenWei(105),
              diffBaseBalance: toBaseTokenWei(-35),
              diffBoostBalance: toBoostTokenWei(0),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(100),
              diffBoostBalance: toBoostTokenWei(0),
            },
          },
        },
      );
    });

    it('4. 3 boost deposits, exact reached goal', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(20),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(30),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
          {
            baseDeposit: toBaseTokenWei(50),
            user: 'user3',
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(20),
              baseRefunded: toBaseTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-20),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(30),
              baseRefunded: toBaseTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-30),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user3: {
              baseAllocation: toBaseTokenWei(50),
              baseRefunded: toBaseTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-50),
              diffBoostBalance: toBoostTokenWei(0),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(100),
              diffBoostBalance: toBoostTokenWei(0),
            },
          },
        },
      );
    });

    it('5. 3 boost deposits, unreached goal', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(10),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(20),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
          {
            baseDeposit: toBaseTokenWei(30),
            user: 'user3',
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(0),
              boostDeposit: toBoostTokenWei(50),
              boostRefunded: toBoostTokenWei(50),
              diffBaseBalance: toBaseTokenWei(-10),
              diffBoostBalance: toBoostTokenWei(50),
            },
            user2: {
              baseAllocation: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(0),
              boostDeposit: toBoostTokenWei(100),
              boostRefunded: toBoostTokenWei(100),
              diffBaseBalance: toBaseTokenWei(-20),
              diffBoostBalance: toBoostTokenWei(100),
            },
            user3: {
              baseAllocation: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(0),
              boostDeposit: toBoostTokenWei(150),
              boostRefunded: toBoostTokenWei(150),
              diffBaseBalance: toBaseTokenWei(-30),
              diffBoostBalance: toBoostTokenWei(150),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(60),
              diffBoostBalance: toBoostTokenWei(-300),
            },
          },
        },
      );
    });

    it('6. 1 extra simple, 1 simple, 1 boost', async function () {
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
            boostExchangeRate: seedData.boostExchangeRate,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(50),
              baseRefunded: toBaseTokenWei(100),
              boostRefunded: toBoostTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-50),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(20),
              baseRefunded: toBaseTokenWei(40),
              boostRefunded: toBoostTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-20),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user3: {
              baseAllocation: toBaseTokenWei(30),
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
              diffBaseBalance: toBaseTokenWei(100),
              diffBoostBalance: toBoostTokenWei(0),
            },
          },
        },
      );
    });

    it('7. 1 extra simple, 1 extra boost, 1 boost', async function () {
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
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(200),
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(90),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(900),
              diffBaseBalance: toBaseTokenWei(-270),
              diffBoostBalance: toBoostTokenWei(900),
            },
            user3: {
              baseAllocation: toBaseTokenWei(10),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(100),
              diffBaseBalance: toBaseTokenWei(-30),
              diffBoostBalance: toBoostTokenWei(100),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(300),
              diffBoostBalance: toBoostTokenWei(-1000),
            },
          },
        },
      );
    });

    it('8. 1 extra simple, 1 extra boost, 1 boost. Invoke WithdrawBaseSwappedAmount method', async function () {
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
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(200),
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(90),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(900),
              diffBaseBalance: toBaseTokenWei(-270),
              diffBoostBalance: toBoostTokenWei(900),
            },
            user3: {
              baseAllocation: toBaseTokenWei(10),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(100),
              diffBaseBalance: toBaseTokenWei(-30),
              diffBoostBalance: toBoostTokenWei(100),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(300),
              diffBoostBalance: toBoostTokenWei(-1000),
            },
          },
        },
      );
    });

    it('9. 1 extra simple, 1 extra boost, 1 boost. Check calculateExcessBoostAmount method', async function () {
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
          excessBoostAmount: toBoostTokenWei(2456),
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(200),
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(90),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(900),
              diffBaseBalance: toBaseTokenWei(-270),
              diffBoostBalance: toBoostTokenWei(900),
            },
            user3: {
              baseAllocation: toBaseTokenWei(10),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(100),
              diffBaseBalance: toBaseTokenWei(-30),
              diffBoostBalance: toBoostTokenWei(100),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(3456),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(300),
              diffBoostBalance: toBoostTokenWei(-4456),
            },
          },
        },
      );
    });

    it('10. 1 extra simple, 1 extra boost, 1 boost. Check calculateExcessBoostAmount method', async function () {
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
          excessBoostAmount: toBoostTokenWei(2456),
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(200),
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(90),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(900),
              diffBaseBalance: toBaseTokenWei(-270),
              diffBoostBalance: toBoostTokenWei(900),
            },
            user3: {
              baseAllocation: toBaseTokenWei(10),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(100),
              diffBaseBalance: toBaseTokenWei(-30),
              diffBoostBalance: toBoostTokenWei(100),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(300),
              diffBoostBalance: toBoostTokenWei(-1000),
            },
          },
        },
      );
    });

    it('11. 2 simple boost from one user', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(70),
            boost: true,
            boostExchangeRate: toWei(0.2),
          },
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(60),
            boost: true,
            boostExchangeRate: toWei(0.3),
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
              boostDeposit: toBoostTokenWei(550),
              boostRefund: toBoostTokenWei(126.923),
              boostRefunded: toBoostTokenWei(126.923),
              nonce: 2,
              boosted: true,
              boostAverageExchangeRate: toWei(0.236),
            },
            user2: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user3: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(130),
              diffBoostBalance: toBoostTokenWei(-126.923),
            },
          },
        },
      );
    });

    it('12. simple and boost from one user, unreached goal', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(10),
            boost: false,
          },
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(20),
            boost: true,
            boostExchangeRate: toWei(0.3),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseDeposited: toBaseTokenWei(30),
              baseAllocation: toBaseTokenWei(0),
              baseDeposit: toBaseTokenWei(0),
              baseRefund: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(0),
              boostDeposit: toBoostTokenWei(100),
              boostRefund: toBoostTokenWei(100),
              boostRefunded: toBoostTokenWei(100),
              nonce: 2,
              boosted: true,
              boostAverageExchangeRate: toWei(0.3),
              diffBaseBalance: toBaseTokenWei(-30),
              diffBoostBalance: toBoostTokenWei(100),
            },
            user2: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user3: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(30),
              diffBoostBalance: toBoostTokenWei(-100),
            },
          },
        },
      );
    });

    it('13. simple and boost from one user', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(70),
            boost: false,
          },
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(60),
            boost: true,
            boostExchangeRate: toWei(0.3),
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
              boostDeposit: toBoostTokenWei(433.333),
              boostRefund: toBoostTokenWei(100),
              boostRefunded: toBoostTokenWei(100),
              nonce: 2,
              boosted: true,
              boostAverageExchangeRate: toWei(0.3),
              diffBaseBalance: toBaseTokenWei(-130),
              diffBoostBalance: toBoostTokenWei(100),
            },
            user2: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user3: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(130),
              diffBoostBalance: toBoostTokenWei(-100),
            },
          },
        },
      );
    });

    it('14. check totalBaseNonBoostDeposited, totalBaseBoostDeposited and totalBaseDeposited', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(100),
            boost: false,
            expectedTotalBaseNonBoostDeposited: toBaseTokenWei(100),
            expectedTotalBaseBoostDeposited: toBaseTokenWei(0),
            expectedTotalBaseDeposited: toBaseTokenWei(100),
          },
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(200),
            boost: false,
            expectedTotalBaseNonBoostDeposited: toBaseTokenWei(300),
            expectedTotalBaseBoostDeposited: toBaseTokenWei(0),
            expectedTotalBaseDeposited: toBaseTokenWei(300),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(50),
            expectedTotalBaseNonBoostDeposited: toBaseTokenWei(350),
            expectedTotalBaseBoostDeposited: toBaseTokenWei(0),
            expectedTotalBaseDeposited: toBaseTokenWei(350),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(100),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
            expectedTotalBaseNonBoostDeposited: toBaseTokenWei(300),
            expectedTotalBaseBoostDeposited: toBaseTokenWei(150),
            expectedTotalBaseDeposited: toBaseTokenWei(450),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(50),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
            expectedTotalBaseNonBoostDeposited: toBaseTokenWei(300),
            expectedTotalBaseBoostDeposited: toBaseTokenWei(200),
            expectedTotalBaseDeposited: toBaseTokenWei(500),
          },
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(100),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
            expectedTotalBaseNonBoostDeposited: toBaseTokenWei(0),
            expectedTotalBaseBoostDeposited: toBaseTokenWei(600),
            expectedTotalBaseDeposited: toBaseTokenWei(600),
          },
        ],
        {
          userExpectations: {
            user1: {
              baseDeposited: toBaseTokenWei(400),
              baseAllocation: toBaseTokenWei(66.667),
              baseDeposit: toBaseTokenWei(0),
              baseRefund: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(0),
              boostDeposit: toBoostTokenWei(2000),
              boostRefund: toBoostTokenWei(1666.667),
              boostRefunded: toBoostTokenWei(1666.667),
              nonce: 3,
              boosted: true,
              boostAverageExchangeRate: toWei(0.2),
              diffBaseBalance: toBaseTokenWei(-400),
              diffBoostBalance: toBoostTokenWei(1666.667),
            },
            user2: {
              baseDeposited: toBaseTokenWei(200),
              baseAllocation: toBaseTokenWei(33.333),
              baseDeposit: toBaseTokenWei(0),
              baseRefund: toBaseTokenWei(0),
              baseRefunded: toBaseTokenWei(0),
              boostDeposit: toBoostTokenWei(1000),
              boostRefund: toBoostTokenWei(833.333),
              boostRefunded: toBoostTokenWei(833.333),
              nonce: 3,
              boosted: true,
              boostAverageExchangeRate: toWei(0.2),
              diffBaseBalance: toBaseTokenWei(-200),
              diffBoostBalance: toBoostTokenWei(833.333),
            },
            user3: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(600),
              diffBoostBalance: toBoostTokenWei(-2500),
            },
          },
        },
      );
    });
  });
}
