import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { INITIAL_POSITIVE_CHECK_TEST_TITLE } from '~common';
import { waitTx } from '~common-contract';
import { contractConfig, seedData } from '~seeds';
import { addSecondsToUnixTime, signMessageForDeposit } from '~utils';
import { customError } from './testData';
import { DepositEventArgs } from './types';
import {
  checkTotalSQRBalance,
  findEvent,
  getERC20TokenBalance,
  loadSQRpProRataFixture,
} from './utils';

export function shouldBehaveCorrectFunding(): void {
  describe('funding', () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this);
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it('user1 tries to call depositSig too early', async function () {
      expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);

      const signature = await signMessageForDeposit(
        this.owner2,
        this.user1Address,
        seedData.deposit1,
        seedData.depositNonce1_0,
        seedData.depositTransactionId1,
        seedData.startDatePlus1m,
      );

      await expect(
        this.user1SQRpProRata.depositSig(
          this.user1Address,
          seedData.deposit1,
          seedData.depositTransactionId1,
          seedData.startDatePlus1m,
          signature,
        ),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.tooEarly);
    });

    it('user1 tries to call depositSig too late', async function () {
      await time.increaseTo(addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift));

      expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);

      const signature = await signMessageForDeposit(
        this.owner2,
        this.user1Address,
        seedData.deposit1,
        seedData.depositNonce1_0,
        seedData.depositTransactionId1,
        seedData.closeDatePlus1m,
      );

      await expect(
        this.user1SQRpProRata.depositSig(
          this.user1Address,
          seedData.deposit1,
          seedData.depositTransactionId1,
          seedData.closeDatePlus1m,
          signature,
        ),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.tooLate);
    });

    describe('set time after start date', () => {
      beforeEach(async function () {
        await time.increaseTo(addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift));
      });

      it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
        expect(await this.user1SQRpProRata.getNonce(this.user1Address)).eq(0);
        expect(await this.user2SQRpProRata.getNonce(this.user2Address)).eq(0);
        expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(contractConfig.goal);
      });

      it('user1 tries to call depositSig with zero amount', async function () {
        const signature = await signMessageForDeposit(
          this.owner2,
          this.user1Address,
          seedData.zero,
          seedData.depositNonce1_0,
          seedData.depositTransactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            this.user1Address,
            seedData.zero,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.amountNotZero);
      });

      it('user1 tries to call depositSig without allowance', async function () {
        const signature = await signMessageForDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.depositTransactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            this.user1Address,
            seedData.deposit1,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.userMustAllowToUseFunds);
      });

      it('user1 tries to call depositSig in timeout case 1m', async function () {
        await time.increaseTo(seedData.startDatePlus1m);

        const signature = await signMessageForDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.depositTransactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            this.user1Address,
            seedData.deposit1,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.timeoutBlocker);
      });

      it('user1 tries to call depositSig with wrong signature', async function () {
        const wrongSignature = await signMessageForDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.depositTransactionIdWrong,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            this.user1Address,
            seedData.deposit1,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
            wrongSignature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.invalidSignature);
      });

      it('user1 tries to call depositSig with allowance but no funds', async function () {
        await this.user1ERC20Token.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

        const signature = await signMessageForDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.depositTransactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            this.user1Address,
            seedData.deposit1,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.userMustHaveFunds);
      });

      it('user2 tries to call depositSig without allowance', async function () {
        const signature = await signMessageForDeposit(
          this.owner2,
          this.user2Address,
          seedData.deposit2,
          seedData.depositNonce2_0,
          seedData.depositTransactionId2,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user2SQRpProRata.depositSig(
            this.user2Address,
            seedData.deposit2,
            seedData.depositTransactionId2,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.userMustAllowToUseFunds);
      });

      describe('user1 and user2 have tokens and approved contract to use these', () => {
        beforeEach(async function () {
          await this.owner2ERC20Token.transfer(this.user1Address, seedData.userInitBalance);
          await this.user1ERC20Token.approve(this.sqrpProRataAddress, seedData.deposit1);

          await this.owner2ERC20Token.transfer(this.user2Address, seedData.userInitBalance);
          await this.user2ERC20Token.approve(this.sqrpProRataAddress, seedData.deposit2);
        });

        it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
          expect(await getERC20TokenBalance(this, this.user1Address)).eq(seedData.userInitBalance);
          expect(await getERC20TokenBalance(this, this.user2Address)).eq(seedData.userInitBalance);
        });

        it('user1 is allowed to deposit (check event)', async function () {
          const signature = await signMessageForDeposit(
            this.owner2,
            this.user1Address,
            seedData.deposit1,
            seedData.depositNonce1_0,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
          );

          const receipt = await waitTx(
            this.user1SQRpProRata.depositSig(
              this.user1Address,
              seedData.deposit1,
              seedData.depositTransactionId1,
              seedData.startDatePlus1m,
              signature,
            ),
          );
          const eventLog = findEvent<DepositEventArgs>(receipt);

          expect(eventLog).not.undefined;
          const [account, amount] = eventLog?.args;
          expect(account).eq(this.user1Address);
          expect(amount).eq(seedData.deposit1);
        });

        it('user1 deposit extrafunds', async function () {
          expect(await getERC20TokenBalance(this, this.coldWalletAddress)).eq(seedData.zero);

          await this.user1ERC20Token.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

          const signature = await signMessageForDeposit(
            this.owner2,
            this.user1Address,
            seedData.extraDeposit1,
            seedData.depositNonce1_0,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
          );

          await this.user1SQRpProRata.depositSig(
            this.user1Address,
            seedData.extraDeposit1,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
            signature,
          );

          const balanceLimit = await this.owner2SQRpProRata.balanceLimit();

          expect(await getERC20TokenBalance(this, this.coldWalletAddress)).eq(
            seedData.extraDeposit1 - balanceLimit,
          );

          expect(await this.owner2SQRpProRata.getBalance()).eq(balanceLimit);

          expect(await getERC20TokenBalance(this, this.user1Address)).eq(
            seedData.userInitBalance - seedData.extraDeposit1,
          );
          expect(await getERC20TokenBalance(this, this.sqrpProRataAddress)).eq(balanceLimit);

          expect(await this.owner2SQRpProRata.balanceOf(this.user1Address)).eq(
            seedData.extraDeposit1,
          );

          const fundItem = await this.user1SQRpProRata.fetchFundItem(this.user1Address);
          expect(fundItem.depositedAmount).eq(seedData.extraDeposit1);

          expect(await this.owner2SQRpProRata.totalDeposited()).eq(seedData.extraDeposit1);

          expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(
            contractConfig.goal - seedData.extraDeposit1,
          );
        });

        it('user1 deposited extra funds', async function () {
          const extraDeposit = seedData.extraDeposit1 * BigInt(2);

          await this.user1ERC20Token.approve(this.sqrpProRataAddress, extraDeposit);

          const signature = await signMessageForDeposit(
            this.owner2,
            this.user1Address,
            extraDeposit,
            seedData.depositNonce1_0,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
          );

          await this.user1SQRpProRata.depositSig(
            this.user1Address,
            extraDeposit,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
            signature,
          );
        });

        it('user1 deposits when user2 transferred tokens to contract directly', async function () {
          await this.user2ERC20Token.transfer(this.sqrpProRataAddress, seedData.extraDeposit2);

          await this.user1ERC20Token.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

          const signature = await signMessageForDeposit(
            this.owner2,
            this.user1Address,
            seedData.deposit1,
            seedData.depositNonce1_0,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
          );

          await this.user1SQRpProRata.depositSig(
            this.user1Address,
            seedData.deposit1,
            seedData.depositTransactionId1,
            seedData.startDatePlus1m,
            signature,
          );

          expect(await this.owner2SQRpProRata.getBalance()).eq(
            await this.owner2SQRpProRata.balanceLimit(),
          );

          expect(await getERC20TokenBalance(this, this.user1Address)).eq(
            seedData.userInitBalance - seedData.deposit1,
          );

          expect(await this.owner2SQRpProRata.balanceOf(this.user1Address)).eq(seedData.deposit1);

          const fundItem = await this.user1SQRpProRata.fetchFundItem(this.user1Address);
          expect(fundItem.depositedAmount).eq(seedData.deposit1);

          expect(await this.owner2SQRpProRata.totalDeposited()).eq(seedData.deposit1);

          const transactionItem = await this.user1SQRpProRata.fetchTransactionItem(
            seedData.depositTransactionId1,
          );
          expect(transactionItem.amount).eq(seedData.deposit1);
        });

        describe('user1 deposit funds', () => {
          beforeEach(async function () {
            const nonce = await this.user1SQRpProRata.getNonce(this.user1Address);

            const signature = await signMessageForDeposit(
              this.owner2,
              this.user1Address,
              seedData.deposit1,
              Number(nonce),
              seedData.depositTransactionId1,
              seedData.startDatePlus1m,
            );

            await this.user1SQRpProRata.depositSig(
              this.user1Address,
              seedData.deposit1,
              seedData.depositTransactionId1,
              seedData.startDatePlus1m,
              signature,
            );
          });

          it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
            expect(await getERC20TokenBalance(this, this.user1Address)).eq(
              seedData.userInitBalance - seedData.deposit1,
            );

            expect(await this.owner2SQRpProRata.balanceOf(this.user1Address)).eq(seedData.deposit1);

            const fundItem = await this.user1SQRpProRata.fetchFundItem(this.user1Address);
            expect(fundItem.depositedAmount).eq(seedData.deposit1);

            expect(await this.owner2SQRpProRata.totalDeposited()).eq(seedData.deposit1);

            const transactionItem = await this.user1SQRpProRata.fetchTransactionItem(
              seedData.depositTransactionId1,
            );
            expect(transactionItem.amount).eq(seedData.deposit1);

            expect(await this.user1SQRpProRata.getNonce(this.user1Address)).eq(1);
            expect(await this.user2SQRpProRata.getNonce(this.user2Address)).eq(0);
          });

          it('user1 tries to call depositSig with the same transactionId', async function () {
            await this.user1ERC20Token.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

            const signature = await signMessageForDeposit(
              this.owner2,
              this.user1Address,
              seedData.deposit1,
              seedData.depositNonce1_1,
              seedData.depositTransactionId1,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1SQRpProRata.depositSig(
                this.user1Address,
                seedData.deposit1,
                seedData.depositTransactionId1,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(this.owner2SQRpProRata, customError.usedTransactionId);
          });
        });
      });
    });
  });
}
