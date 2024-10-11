import { toWei } from '~common';
import { LINEAR_BOOST_FACTOR } from '~constants';
import { BaseContractConfigEx, contractConfig, seedData } from '~seeds';
import { toBaseTokenWei, toBoostTokenWei } from '~utils';
import {
  checkTotalWEB3Balance,
  getTestCaseContactConfig,
  loadWEB3ProRataFixture,
  testContract,
} from './utils';

export function shouldBehaveCorrectFundingPositiveCasesInternalLinear(): void {
  describe('funding: positive cases, internal refund', () => {
    const caseContractConfig: BaseContractConfigEx = {
      ...getTestCaseContactConfig(contractConfig),
      baseGoal: toBaseTokenWei(100),
      linearAllocation: true,
      linearBoostFactor: toWei(LINEAR_BOOST_FACTOR),
    };

    beforeEach(async function () {
      await loadWEB3ProRataFixture(this, {
        contractConfig: caseContractConfig,
      });
      await checkTotalWEB3Balance(this);
    });

    afterEach(async function () {
      await checkTotalWEB3Balance(this);
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
          expectedExcessBoostAmount: toBoostTokenWei(0),
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

    it('6. 1 extra simple, 1 simple, 1 boost - over allocation', async function () {
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

    it('7. 1 simple, 1 boost - over allocation', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(60),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(81),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(19),
              baseRefunded: toBaseTokenWei(41),
              boostRefunded: toBoostTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-19),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(81),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-81),
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

    it('8. 1 extra simple, 1 extra boost, 1 extra boost', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(1000),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(200),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(100),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(40),
              baseRefunded: toBaseTokenWei(960),
              diffBaseBalance: toBaseTokenWei(-40),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(40),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(800),
              diffBaseBalance: toBaseTokenWei(-200),
              diffBoostBalance: toBoostTokenWei(800),
            },
            user3: {
              baseAllocation: toBaseTokenWei(20),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(400),
              diffBaseBalance: toBaseTokenWei(-100),
              diffBoostBalance: toBoostTokenWei(400),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(340),
              diffBoostBalance: toBoostTokenWei(-1200),
            },
          },
        },
      );
    });

    it('9. 1 extra simple, 1 boost, 1 extra boost. Invoke WithdrawBaseSwappedAmount method', async function () {
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
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(100),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
        ],
        {
          invokeWithdrawBaseSwappedAmount: true,
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(20),
              baseRefunded: toBaseTokenWei(180),
              diffBaseBalance: toBaseTokenWei(-20),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(30),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(150),
              diffBaseBalance: toBaseTokenWei(-60),
              diffBoostBalance: toBoostTokenWei(150),
            },
            user3: {
              baseAllocation: toBaseTokenWei(50),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(250),
              diffBaseBalance: toBaseTokenWei(-100),
              diffBoostBalance: toBoostTokenWei(250),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(180),
              diffBoostBalance: toBoostTokenWei(-400),
            },
          },
        },
      );
    });

    it('10. 1 extra simple, 2 boosts. Boost reached 80% level, linear factor = 5', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(100),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(40),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(40),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
        ],
        {
          invokeWithdrawBaseSwappedAmount: true,
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(20),
              baseRefunded: toBaseTokenWei(80),
              diffBaseBalance: toBaseTokenWei(-20),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(40),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-40),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user3: {
              baseAllocation: toBaseTokenWei(40),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-40),
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

    it('11. 1 extra simple, 2 boosts. Boost reached 81% level, linear factor = 5', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(100),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(41),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(40),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
        ],
        {
          invokeWithdrawBaseSwappedAmount: true,
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(19.802),
              baseRefunded: toBaseTokenWei(80.198),
              diffBaseBalance: toBaseTokenWei(-19.802),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(40.594),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(2.03),
              diffBaseBalance: toBaseTokenWei(-41),
              diffBoostBalance: toBoostTokenWei(2.03),
            },
            user3: {
              baseAllocation: toBaseTokenWei(39.604),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(1.98),
              diffBaseBalance: toBaseTokenWei(-40),
              diffBoostBalance: toBoostTokenWei(1.98),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(0),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(100.802),
              diffBoostBalance: toBoostTokenWei(-4.01),
            },
          },
        },
      );
    });

    it('12. 1 simple, 1 boosts. Boost reached 95% level, linear factor = 5 - over allocation', async function () {
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
            baseDeposit: toBaseTokenWei(95),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
        ],
        {
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(5),
              baseRefunded: toBaseTokenWei(5),
              diffBaseBalance: toBaseTokenWei(-5),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(95),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(0),
              diffBaseBalance: toBaseTokenWei(-95),
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

    it('13. 1 extra simple, 1 extra boost, 1 boost. Check calculateExcessBoostAmount method', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(2000),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(550),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
          {
            user: 'user3',
            baseDeposit: toBaseTokenWei(50),
            boost: true,
            boostExchangeRate: seedData.boostExchangeRate,
          },
        ],
        {
          invokeWithdrawBaseSwappedAmount: true,
          sendTokensToContract: {
            boostAmount: toBoostTokenWei(3456),
          },
          expectedExcessBoostAmount: toBoostTokenWei(3456 - 2700),
          userExpectations: {
            user1: {
              baseAllocation: toBaseTokenWei(40),
              baseRefunded: toBaseTokenWei(1960),
              diffBaseBalance: toBaseTokenWei(-40),
              diffBoostBalance: toBoostTokenWei(0),
            },
            user2: {
              baseAllocation: toBaseTokenWei(55),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(2475),
              diffBaseBalance: toBaseTokenWei(-550),
              diffBoostBalance: toBoostTokenWei(2475),
            },
            user3: {
              baseAllocation: toBaseTokenWei(5),
              baseRefunded: toBaseTokenWei(0),
              boostRefunded: toBoostTokenWei(225),
              diffBaseBalance: toBaseTokenWei(-50),
              diffBoostBalance: toBoostTokenWei(225),
            },
            contract: {
              diffBaseBalance: toBaseTokenWei(0),
              diffBoostBalance: toBoostTokenWei(3456),
            },
            owner2: {
              diffBaseBalance: toBaseTokenWei(640),
              diffBoostBalance: toBoostTokenWei(-6156),
            },
          },
        },
      );
    });

    it('14. simple and boost from one user, unreached goal', async function () {
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

    it('15. simple and boost from one user', async function () {
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

    it.skip('16. simple test', async function () {
      await testContract(
        this,
        caseContractConfig,
        [
          {
            user: 'user1',
            baseDeposit: toBaseTokenWei(10000),
          },
          {
            user: 'user2',
            baseDeposit: toBaseTokenWei(50000),
            boost: true,
            boostExchangeRate: toWei(0.3),
          },
        ],
        {},
      );
    });
  });
}
