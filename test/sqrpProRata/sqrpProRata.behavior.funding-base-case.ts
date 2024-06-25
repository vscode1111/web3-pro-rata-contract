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
  describe('funding: different positive cases', () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this, caseContractConfig);
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it('no boost', async function () {
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
      ];

      await checkDepositRecords(this, caseContractConfig, depositRecords);
    });
  });
}
