import { v4 as uuidv4 } from 'uuid';
import { toUnixTime, toWei } from '~common';
import { ContractConfig, contractConfig, now, tokenDecimals } from '~seeds';
import { checkDepositRecords, checkTotalSQRBalance, loadSQRpProRataFixture } from './utils';

const caseContractConfig: ContractConfig = {
  ...contractConfig,
  baseGoal: toWei(100, tokenDecimals),
  startDate: toUnixTime(now.add(30, 'days').toDate()),
  closeDate: toUnixTime(now.add(32, 'days').toDate()),
};

export function shouldBehaveCorrectFundingBaseCase(): void {
  describe.only('funding: different positive cases', () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this, caseContractConfig);
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it('3 simple deposits, unreached goal', async function () {
      const depositRecords = [
        {
          deposit: toWei(10, tokenDecimals),
          userAddress: this.user1Address,
          userBaseToken: this.user1BaseToken,
          userSQRpProRata: this.user1SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(0, tokenDecimals),
          refund: toWei(10, tokenDecimals),
        },
        {
          deposit: toWei(20, tokenDecimals),
          userAddress: this.user2Address,
          userBaseToken: this.user2BaseToken,
          userSQRpProRata: this.user2SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(0, tokenDecimals),
          refund: toWei(20, tokenDecimals),
        },
        {
          deposit: toWei(30, tokenDecimals),
          userAddress: this.user3Address,
          userBaseToken: this.user3BaseToken,
          userSQRpProRata: this.user3SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(0, tokenDecimals),
          refund: toWei(30, tokenDecimals),
        },
      ];

      await checkDepositRecords(this, caseContractConfig, depositRecords);
    });

    it('3 simple deposits, exact reached goal', async function () {
      const depositRecords = [
        {
          deposit: toWei(20, tokenDecimals),
          userAddress: this.user1Address,
          userBaseToken: this.user1BaseToken,
          userSQRpProRata: this.user1SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(20, tokenDecimals),
          refund: toWei(0, tokenDecimals),
        },
        {
          deposit: toWei(30, tokenDecimals),
          userAddress: this.user2Address,
          userBaseToken: this.user2BaseToken,
          userSQRpProRata: this.user2SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(30, tokenDecimals),
          refund: toWei(0, tokenDecimals),
        },
        {
          deposit: toWei(50, tokenDecimals),
          userAddress: this.user3Address,
          userBaseToken: this.user3BaseToken,
          userSQRpProRata: this.user3SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(50, tokenDecimals),
          refund: toWei(0, tokenDecimals),
        },
      ];

      await checkDepositRecords(this, caseContractConfig, depositRecords);
    });

    it('1 extra simple, 1 simple, 1 extra simple,', async function () {
      const depositRecords = [
        {
          deposit: toWei(200, tokenDecimals),
          userAddress: this.user1Address,
          userBaseToken: this.user1BaseToken,
          userSQRpProRata: this.user1SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(50, tokenDecimals),
          refund: toWei(150, tokenDecimals),
        },
        {
          deposit: toWei(60, tokenDecimals),
          userAddress: this.user2Address,
          userBaseToken: this.user2BaseToken,
          userSQRpProRata: this.user2SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(15, tokenDecimals),
          refund: toWei(45, tokenDecimals),
        },
        {
          deposit: toWei(140, tokenDecimals),
          userAddress: this.user3Address,
          userBaseToken: this.user3BaseToken,
          userSQRpProRata: this.user3SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(35, tokenDecimals),
          refund: toWei(105, tokenDecimals),
        },
        // {
        //   deposit: toWei(140, tokenDecimals),
        //   userAddress: this.user3Address,
        //   userBaseToken: this.user3BaseToken,
        //   userSQRpProRata: this.user3SQRpProRata,
        //   transactionId: uuidv4(),
        //   //expect
        //   allocation: toWei(35, tokenDecimals),
        //   refund: toWei(105, tokenDecimals),
        // },
      ];

      await checkDepositRecords(this, caseContractConfig, depositRecords);
    });

    it('3 boost deposits, exact reached goal', async function () {
      const depositRecords = [
        {
          deposit: toWei(20, tokenDecimals),
          userAddress: this.user1Address,
          userBaseToken: this.user1BaseToken,
          userSQRpProRata: this.user1SQRpProRata,
          transactionId: uuidv4(),
          boost: true,
          //expect
          allocation: toWei(20, tokenDecimals),
          refund: toWei(0, tokenDecimals),
        },
        {
          deposit: toWei(30, tokenDecimals),
          userAddress: this.user2Address,
          userBaseToken: this.user2BaseToken,
          userSQRpProRata: this.user2SQRpProRata,
          transactionId: uuidv4(),
          boost: true,
          //expect
          allocation: toWei(30, tokenDecimals),
          refund: toWei(0, tokenDecimals),
        },
        {
          deposit: toWei(50, tokenDecimals),
          userAddress: this.user3Address,
          userBaseToken: this.user3BaseToken,
          userSQRpProRata: this.user3SQRpProRata,
          transactionId: uuidv4(),
          boost: true,
          //expect
          allocation: toWei(50, tokenDecimals),
          refund: toWei(0, tokenDecimals),
        },
      ];

      await checkDepositRecords(this, caseContractConfig, depositRecords);
    });

    it('1 extra simple, 1 simple, 1 boost', async function () {
      const depositRecords = [
        {
          deposit: toWei(150, tokenDecimals),
          userAddress: this.user1Address,
          userBaseToken: this.user1BaseToken,
          userSQRpProRata: this.user1SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(50, tokenDecimals),
          refund: toWei(100, tokenDecimals),
        },
        {
          deposit: toWei(60, tokenDecimals),
          userAddress: this.user2Address,
          userBaseToken: this.user2BaseToken,
          userSQRpProRata: this.user2SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(20, tokenDecimals),
          refund: toWei(40, tokenDecimals),
        },
        {
          deposit: toWei(30, tokenDecimals),
          userAddress: this.user3Address,
          userBaseToken: this.user3BaseToken,
          userSQRpProRata: this.user3SQRpProRata,
          transactionId: uuidv4(),
          boost: true,
          //expect
          allocation: toWei(30, tokenDecimals),
          refund: toWei(0, tokenDecimals),
        },
      ];

      await checkDepositRecords(this, caseContractConfig, depositRecords);
    });

    it('1 extra simple, 1 extra boost, 1 boost', async function () {
      const depositRecords = [
        {
          deposit: toWei(200, tokenDecimals),
          userAddress: this.user1Address,
          userBaseToken: this.user1BaseToken,
          userSQRpProRata: this.user1SQRpProRata,
          transactionId: uuidv4(),
          //expect
          allocation: toWei(0, tokenDecimals),
          refund: toWei(200, tokenDecimals),
        },
        {
          deposit: toWei(270, tokenDecimals),
          userAddress: this.user2Address,
          userBaseToken: this.user2BaseToken,
          userSQRpProRata: this.user2SQRpProRata,
          transactionId: uuidv4(),
          boost: true,
          //expect
          allocation: toWei(90, tokenDecimals),
          refund: toWei(180, tokenDecimals),
        },
        {
          deposit: toWei(30, tokenDecimals),
          userAddress: this.user3Address,
          userBaseToken: this.user3BaseToken,
          userSQRpProRata: this.user3SQRpProRata,
          transactionId: uuidv4(),
          boost: true,
          //expect
          allocation: toWei(10, tokenDecimals),
          refund: toWei(20, tokenDecimals),
        },
      ];

      await checkDepositRecords(this, caseContractConfig, depositRecords);
    });
  });
}
