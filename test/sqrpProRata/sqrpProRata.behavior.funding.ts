import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { INITIAL_POSITIVE_CHECK_TEST_TITLE } from '~common';
import { waitTx } from '~common-contract';
import { contractConfig, seedData } from '~seeds';
import { addSecondsToUnixTime, signMessageForDeposit, signMessageForWithdraw } from '~utils';
import { customError } from './testData';
import { DepositEventArgs, ForceWithdrawEventArgs, WithdrawEventArgs } from './types';
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
      expect(await this.owner2SQRpProRata.calculateRemainWithdraw()).eq(seedData.zero);

      const signature = await signMessageForDeposit(
        this.owner2,
        seedData.userId1,
        seedData.depositTransactionId1,
        this.user1Address,
        seedData.deposit1,
        seedData.depositNonce1_0,
        seedData.startDatePlus1m,
      );

      await expect(
        this.user1SQRpProRata.depositSig(
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.startDatePlus1m,
          signature,
        ),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.tooEarly);
    });

    it('user1 tries to call depositSig too late', async function () {
      await time.increaseTo(addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift));

      expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);
      expect(await this.owner2SQRpProRata.calculateRemainWithdraw()).eq(seedData.zero);

      const signature = await signMessageForDeposit(
        this.owner2,
        seedData.userId1,
        seedData.depositTransactionId1,
        this.user1Address,
        seedData.deposit1,
        seedData.depositNonce1_0,
        seedData.closeDatePlus1m,
      );

      await expect(
        this.user1SQRpProRata.depositSig(
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
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
        expect(await this.user1SQRpProRata.getDepositNonce(seedData.userId1)).eq(0);
        expect(await this.user2SQRpProRata.getDepositNonce(seedData.userId2)).eq(0);
        expect(await this.user1SQRpProRata.getWithdrawNonce(seedData.userId1)).eq(0);
        expect(await this.user2SQRpProRata.getWithdrawNonce(seedData.userId2)).eq(0);
        expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(
          contractConfig.depositGoal,
        );
      });

      it('user1 tries to call depositSig with zero amount', async function () {
        const signature = await signMessageForDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.zero,
          seedData.depositNonce1_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.zero,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.amountNotZero);
      });

      it('user1 tries to call depositSig without allowance', async function () {
        const signature = await signMessageForDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(
          this.owner2SQRpProRata,
          customError.userMustAllowToUseFunds,
        );
      });

      it('user1 tries to call depositSig in timeout case 1m', async function () {
        await time.increaseTo(seedData.startDatePlus1m);

        const signature = await signMessageForDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.timeoutBlocker);
      });

      it('user1 tries to call depositSig with wrong signature', async function () {
        const wrongSignature = await signMessageForDeposit(
          this.owner2,
          seedData.userId2,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.startDatePlus1m,
            wrongSignature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.invalidSignature);
      });

      it('user1 tries to call depositSig with allowance but no funds', async function () {
        await this.user1ERC20Token.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

        const signature = await signMessageForDeposit(
          this.owner2,
          seedData.userId1,
          seedData.depositTransactionId1,
          this.user1Address,
          seedData.deposit1,
          seedData.depositNonce1_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.userMustHaveFunds);
      });

      it('user2 tries to call depositSig without allowance', async function () {
        const signature = await signMessageForDeposit(
          this.owner2,
          seedData.userId2,
          seedData.depositTransactionId2,
          this.user2Address,
          seedData.deposit2,
          seedData.depositNonce2_0,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user2SQRpProRata.depositSig(
            seedData.userId2,
            seedData.depositTransactionId2,
            this.user2Address,
            seedData.deposit2,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(
          this.owner2SQRpProRata,
          customError.userMustAllowToUseFunds,
        );
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

        it('check hash collision for signMessageForDeposit', async function () {
          const wrongSignature = await signMessageForDeposit(
            this.owner2,
            '123',
            '123',
            this.user1Address,
            seedData.deposit1,
            seedData.depositNonce1_0,
            seedData.startDatePlus1m,
          );

          await expect(
            this.user1SQRpProRata.depositSig(
              '12',
              '3123',
              this.user1Address,
              seedData.deposit1,
              seedData.startDatePlus1m,
              wrongSignature,
            ),
          ).revertedWithCustomError(this.owner2SQRpProRata, customError.invalidSignature);
        });

        it('user1 is allowed to deposit (check event)', async function () {
          const signature = await signMessageForDeposit(
            this.owner2,
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.depositNonce1_0,
            seedData.startDatePlus1m,
          );

          const receipt = await waitTx(
            this.user1SQRpProRata.depositSig(
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.deposit1,
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

        it('user1 tries to call deposit without permission', async function () {
          await expect(
            this.user1SQRpProRata.deposit(
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.extraDeposit1,
              seedData.depositNonce1_0,
              seedData.startDatePlus1m,
            ),
          )
            .revertedWithCustomError(
              this.owner2SQRpProRata,
              customError.ownableUnauthorizedAccount,
            )
            .withArgs(this.user1Address);
        });

        it('owner2 tries to call deposit with invalid nonce', async function () {
          await expect(
            this.owner2SQRpProRata.deposit(
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.deposit1,
              seedData.invalidNonce,
              seedData.startDatePlus1m,
            ),
          ).revertedWithCustomError(this.owner2SQRpProRata, customError.invalidNonce);
        });

        it('owner2 deposit funds', async function () {
          expect(await getERC20TokenBalance(this, this.coldWalletAddress)).eq(seedData.zero);

          await this.user1ERC20Token.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

          const nonce = await this.user2SQRpProRata.getDepositNonce(seedData.userId1);

          await this.owner2SQRpProRata.deposit(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.extraDeposit1,
            nonce,
            seedData.startDatePlus1m,
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

          expect(await this.owner2SQRpProRata.balanceOf(seedData.userId1)).eq(
            seedData.extraDeposit1,
          );

          const fundItem = await this.user1SQRpProRata.fetchFundItem(seedData.userId1);
          expect(fundItem.depositedAmount).eq(seedData.extraDeposit1);
          expect(await this.owner2SQRpProRata.totalDeposited()).eq(seedData.extraDeposit1);
          expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(
            contractConfig.depositGoal - seedData.extraDeposit1,
          );
        });

        it('user1 deposit extrafunds', async function () {
          expect(await getERC20TokenBalance(this, this.coldWalletAddress)).eq(seedData.zero);

          await this.user1ERC20Token.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

          const signature = await signMessageForDeposit(
            this.owner2,
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.extraDeposit1,
            seedData.depositNonce1_0,
            seedData.startDatePlus1m,
          );

          await this.user1SQRpProRata.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.extraDeposit1,
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

          expect(await this.owner2SQRpProRata.balanceOf(seedData.userId1)).eq(
            seedData.extraDeposit1,
          );

          const fundItem = await this.user1SQRpProRata.fetchFundItem(seedData.userId1);
          expect(fundItem.depositedAmount).eq(seedData.extraDeposit1);

          expect(await this.owner2SQRpProRata.totalDeposited()).eq(seedData.extraDeposit1);

          expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(
            contractConfig.depositGoal - seedData.extraDeposit1,
          );
        });

        it('user1 tries to deposit extra funds', async function () {
          const extraDeposit = seedData.extraDeposit1 * BigInt(2);

          await this.user1ERC20Token.approve(this.sqrpProRataAddress, extraDeposit);

          const signature = await signMessageForDeposit(
            this.owner2,
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            extraDeposit,
            seedData.depositNonce1_0,
            seedData.startDatePlus1m,
          );

          await expect(
            this.user1SQRpProRata.depositSig(
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              extraDeposit,
              seedData.startDatePlus1m,
              signature,
            ),
          ).revertedWithCustomError(this.owner2SQRpProRata, customError.achievedDepositGoal);
        });

        it('user1 deposits when user2 transferred tokens to contract directly', async function () {
          await this.user2ERC20Token.transfer(
            this.sqrpProRataAddress,
            seedData.extraDeposit2,
          );

          await this.user1ERC20Token.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

          const signature = await signMessageForDeposit(
            this.owner2,
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.depositNonce1_0,
            seedData.startDatePlus1m,
          );

          await this.user1SQRpProRata.depositSig(
            seedData.userId1,
            seedData.depositTransactionId1,
            this.user1Address,
            seedData.deposit1,
            seedData.startDatePlus1m,
            signature,
          );

          expect(await this.owner2SQRpProRata.getBalance()).eq(
            await this.owner2SQRpProRata.balanceLimit(),
          );

          expect(await getERC20TokenBalance(this, this.user1Address)).eq(
            seedData.userInitBalance - seedData.deposit1,
          );

          expect(await this.owner2SQRpProRata.balanceOf(seedData.userId1)).eq(
            seedData.deposit1,
          );

          const fundItem = await this.user1SQRpProRata.fetchFundItem(seedData.userId1);
          expect(fundItem.depositedAmount).eq(seedData.deposit1);

          expect(await this.owner2SQRpProRata.totalDeposited()).eq(seedData.deposit1);

          const transactionItem = await this.user1SQRpProRata.fetchTransactionItem(
            seedData.depositTransactionId1,
          );
          expect(transactionItem.amount).eq(seedData.deposit1);
        });

        describe('user1 deposit funds', () => {
          beforeEach(async function () {
            const nonce = await this.user1SQRpProRata.getDepositNonce(seedData.userId1);

            const signature = await signMessageForDeposit(
              this.owner2,
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.deposit1,
              Number(nonce),
              seedData.startDatePlus1m,
            );

            await this.user1SQRpProRata.depositSig(
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.deposit1,
              seedData.startDatePlus1m,
              signature,
            );
          });

          it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
            expect(await getERC20TokenBalance(this, this.user1Address)).eq(
              seedData.userInitBalance - seedData.deposit1,
            );

            expect(await this.owner2SQRpProRata.balanceOf(seedData.userId1)).eq(
              seedData.deposit1,
            );

            const fundItem = await this.user1SQRpProRata.fetchFundItem(seedData.userId1);
            expect(fundItem.depositedAmount).eq(seedData.deposit1);

            expect(await this.owner2SQRpProRata.totalDeposited()).eq(seedData.deposit1);

            const transactionItem = await this.user1SQRpProRata.fetchTransactionItem(
              seedData.depositTransactionId1,
            );
            expect(transactionItem.amount).eq(seedData.deposit1);

            expect(await this.user1SQRpProRata.getDepositNonce(seedData.userId1)).eq(1);
            expect(await this.user2SQRpProRata.getDepositNonce(seedData.userId2)).eq(0);
            expect(await this.user1SQRpProRata.getWithdrawNonce(seedData.userId1)).eq(0);
            expect(await this.user2SQRpProRata.getWithdrawNonce(seedData.userId2)).eq(0);

            expect(await this.owner2SQRpProRata.calculateRemainWithdraw()).eq(
              contractConfig.withdrawGoal,
            );
          });

          it('user1 tries to call depositSig with the same transactionId', async function () {
            await this.user1ERC20Token.approve(
              this.sqrpProRataAddress,
              seedData.extraDeposit1,
            );

            const signature = await signMessageForDeposit(
              this.owner2,
              seedData.userId1,
              seedData.depositTransactionId1,
              this.user1Address,
              seedData.deposit1,
              seedData.depositNonce1_1,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1SQRpProRata.depositSig(
                seedData.userId1,
                seedData.depositTransactionId1,
                this.user1Address,
                seedData.deposit1,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(this.owner2SQRpProRata, customError.usedTransactionId);
          });

          it('owner2 call forceWithdraw (check event)', async function () {
            expect(await getERC20TokenBalance(this, this.user3Address)).eq(seedData.zero);

            const contractAmount = await this.owner2SQRpProRata.getBalance();

            const receipt = await waitTx(
              this.owner2SQRpProRata.forceWithdraw(
                this.erc20TokenAddress,
                this.user3Address,
                contractAmount,
              ),
            );
            const eventLog = findEvent<ForceWithdrawEventArgs>(receipt);

            expect(eventLog).not.undefined;
            const [token, to, amount] = eventLog?.args;
            expect(token).eq(this.erc20TokenAddress);
            expect(to).eq(this.user3Address);
            expect(amount).closeTo(contractAmount, seedData.balanceDelta);

            expect(await getERC20TokenBalance(this, this.user1Address)).eq(
              seedData.userInitBalance - seedData.deposit1,
            );
            expect(await getERC20TokenBalance(this, this.user2Address)).eq(
              seedData.userInitBalance,
            );
            expect(await getERC20TokenBalance(this, this.user3Address)).eq(contractAmount);

            expect(await this.owner2SQRpProRata.balanceOf(seedData.userId1)).eq(
              seedData.deposit1,
            );
            expect(await this.owner2SQRpProRata.balanceOf(seedData.userId2)).eq(
              seedData.zero,
            );

            const fundItem = await this.user1SQRpProRata.fetchFundItem(seedData.userId1);
            expect(fundItem.depositedAmount).eq(seedData.deposit1);

            expect(await this.owner2SQRpProRata.totalDeposited()).eq(seedData.deposit1);
          });

          it('user1 tries to call forceWithdraw without permission', async function () {
            const contractAmount = await this.owner2SQRpProRata.getBalance();

            await expect(
              this.user1SQRpProRata.forceWithdraw(
                this.erc20TokenAddress,
                this.user3Address,
                contractAmount,
              ),
            )
              .revertedWithCustomError(
                this.owner2SQRpProRata,
                customError.ownableUnauthorizedAccount,
              )
              .withArgs(this.user1Address);
          });

          it('user1 tries to call withdrawSig with wrong signature', async function () {
            const signature = await signMessageForWithdraw(
              this.owner2,
              seedData.userId2,
              seedData.withdrawTransactionId1_0,
              this.user1Address,
              seedData.extraWithdraw1,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1SQRpProRata.withdrawSig(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.extraWithdraw1,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(this.owner2SQRpProRata, customError.invalidSignature);
          });

          it('user1 tries to call depositSig in timeout case 1m', async function () {
            await time.increaseTo(seedData.startDatePlus1m);

            const signature = await signMessageForWithdraw(
              this.owner2,
              seedData.userId1,
              seedData.withdrawTransactionId1_0,
              this.user1Address,
              seedData.extraWithdraw1,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1SQRpProRata.withdrawSig(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.extraWithdraw1,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(this.owner2SQRpProRata, customError.timeoutBlocker);
          });

          it('user1 tries to call withdrawSig with zero amount', async function () {
            const signature = await signMessageForWithdraw(
              this.owner2,
              seedData.userId2,
              seedData.withdrawTransactionId1_0,
              this.user1Address,
              seedData.zero,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1SQRpProRata.withdrawSig(
                seedData.userId2,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.zero,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(this.owner2SQRpProRata, customError.amountNotZero);
          });

          it('user1 tries to call withdrawSig from contract without required funds', async function () {
            const signature = await signMessageForWithdraw(
              this.owner2,
              seedData.userId1,
              seedData.withdrawTransactionId1_0,
              this.user1Address,
              seedData.extraWithdraw1,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1SQRpProRata.withdrawSig(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.extraWithdraw1,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(
              this.owner2SQRpProRata,
              customError.contractMustHaveSufficientFunds,
            );
          });

          it('user1 tries to call withdraw without permission', async function () {
            await expect(
              this.user1SQRpProRata.withdraw(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.extraWithdraw1,
                seedData.withdrawNonce1_0,
                seedData.startDatePlus1m,
              ),
            )
              .revertedWithCustomError(
                this.owner2SQRpProRata,
                customError.ownableUnauthorizedAccount,
              )
              .withArgs(this.user1Address);
          });

          it('owner2 tries to call withdraw with invalid nonce', async function () {
            await expect(
              this.owner2SQRpProRata.withdraw(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.withdraw1,
                seedData.invalidNonce,
                seedData.startDatePlus1m,
              ),
            ).revertedWithCustomError(this.owner2SQRpProRata, customError.invalidNonce);
          });

          it('user1 tries to call withdraw from contract without required funds', async function () {
            await expect(
              this.owner2SQRpProRata.withdraw(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.extraWithdraw1,
                seedData.withdrawNonce1_0,
                seedData.startDatePlus1m,
              ),
            ).revertedWithCustomError(
              this.owner2SQRpProRata,
              customError.contractMustHaveSufficientFunds,
            );
          });

          it('check hash collision for signMessageForWithdraw', async function () {
            const wrongSignature = await signMessageForWithdraw(
              this.owner2,
              '123',
              '123',
              this.user1Address,
              seedData.deposit1,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1SQRpProRata.withdrawSig(
                '12',
                '3123',
                this.user1Address,
                seedData.deposit1,
                seedData.startDatePlus1m,
                wrongSignature,
              ),
            ).revertedWithCustomError(this.owner2SQRpProRata, customError.invalidSignature);
          });

          it('user1 is allowed to withdraw (check event)', async function () {
            const signature = await signMessageForWithdraw(
              this.owner2,
              seedData.userId1,
              seedData.withdrawTransactionId1_0,
              this.user1Address,
              seedData.withdraw1,
              seedData.withdrawNonce1_0,
              seedData.startDatePlus1m,
            );

            const receipt = await waitTx(
              this.user1SQRpProRata.withdrawSig(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.withdraw1,
                seedData.startDatePlus1m,
                signature,
              ),
            );
            const eventLog = findEvent<WithdrawEventArgs>(receipt);

            expect(eventLog).not.undefined;
            const [account, to, amount] = eventLog?.args;
            expect(account).eq(this.user1Address);
            expect(to).eq(this.user1Address);
            expect(amount).eq(seedData.withdraw1);
          });

          describe('user1 withdrew funds', () => {
            beforeEach(async function () {
              const signature = await signMessageForWithdraw(
                this.owner2,
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.withdraw1,
                seedData.withdrawNonce1_0,
                seedData.startDatePlus1m,
              );

              await this.user1SQRpProRata.withdrawSig(
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.withdraw1,
                seedData.startDatePlus1m,
                signature,
              );
            });

            it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
              const fundItem = await this.user1SQRpProRata.fetchFundItem(seedData.userId1);
              expect(fundItem.withdrewAmount).eq(seedData.withdraw1);
              expect(await this.owner2SQRpProRata.totalWithdrew()).eq(seedData.withdraw1);
              expect(await this.owner2SQRpProRata.calculateRemainWithdraw()).eq(
                contractConfig.withdrawGoal - seedData.withdraw1,
              );
            });

            it('user1 tries to call withdrawSig with the same transactionId', async function () {
              const signature = await signMessageForWithdraw(
                this.owner2,
                seedData.userId1,
                seedData.withdrawTransactionId1_0,
                this.user1Address,
                seedData.withdraw1,
                seedData.withdrawNonce1_1,
                seedData.startDatePlus1m,
              );

              await expect(
                this.user1SQRpProRata.withdrawSig(
                  seedData.userId1,
                  seedData.withdrawTransactionId1_0,
                  this.user1Address,
                  seedData.withdraw1,
                  seedData.startDatePlus1m,
                  signature,
                ),
              ).revertedWithCustomError(
                this.owner2SQRpProRata,
                customError.usedTransactionId,
              );
            });

            it('user1 tries to call withdrawSig with the same transactionId', async function () {
              await this.owner2ERC20Token.transfer(
                this.sqrpProRataAddress,
                seedData.userInitBalance,
              );

              const extraWithdraw = seedData.extraWithdraw1 * BigInt(2);

              const signature = await signMessageForWithdraw(
                this.owner2,
                seedData.userId1,
                seedData.withdrawTransactionId1_1,
                this.user1Address,
                extraWithdraw,
                seedData.withdrawNonce1_1,
                seedData.startDatePlus1m,
              );

              await expect(
                this.user1SQRpProRata.withdrawSig(
                  seedData.userId1,
                  seedData.withdrawTransactionId1_1,
                  this.user1Address,
                  extraWithdraw,
                  seedData.startDatePlus1m,
                  signature,
                ),
              ).revertedWithCustomError(
                this.owner2SQRpProRata,
                customError.achievedWithdrawGoal,
              );
            });
          });
        });
      });
    });
  });
}
