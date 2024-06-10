import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { INITIAL_POSITIVE_CHECK_TEST_TITLE } from '~common';
import { waitTx } from '~common-contract';
import { contractConfig, seedData, tokenConfig } from '~seeds';
import {
  addSecondsToUnixTime,
  calculateAccountRefundAmount,
  signMessageForSQRpProRataDeposit,
} from '~utils';
import { customError } from './testData';
import { DepositEventArgs, RefundEventArgs, WithdrawGoalEventArgs } from './types';
import {
  checkTotalSQRBalance,
  contractZeroCheck,
  depositSig,
  findEvent,
  getBaseTokenBalance,
  loadSQRpProRataFixture,
  transferToUserAndApproveForContract,
} from './utils';

export function shouldBehaveCorrectFundingDefaultCase(): void {
  describe('funding: default case', () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this);
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
      await contractZeroCheck(this);
    });

    it('user1 tries to call withdrawGoal without permission', async function () {
      await expect(this.user1SQRpProRata.withdrawGoal()).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.ownableUnauthorizedAccount,
      );
    });

    it('owner tries to call withdrawGoal to early', async function () {
      await expect(this.owner2SQRpProRata.withdrawGoal()).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.tooEarly,
      );
    });

    it('user1 tries to call depositSig too early', async function () {
      const signature = await signMessageForSQRpProRataDeposit(
        this.owner2,
        this.user1Address,
        seedData.deposit1,
        false,
        seedData.depositNonce1_0,
        seedData.transactionId1,
        seedData.startDatePlus1m,
      );

      await expect(
        this.user1SQRpProRata.depositSig(
          seedData.deposit1,
          false,
          seedData.transactionId1,
          seedData.startDatePlus1m,
          signature,
        ),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.tooEarly);
    });

    it('user1 tries to call depositSig too late', async function () {
      await time.increaseTo(addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift));

      expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);

      const signature = await signMessageForSQRpProRataDeposit(
        this.owner2,
        this.user1Address,
        seedData.deposit1,
        false,
        seedData.depositNonce1_0,
        seedData.transactionId1,
        seedData.closeDatePlus1m,
      );

      await expect(
        this.user1SQRpProRata.depositSig(
          seedData.deposit1,
          false,
          seedData.transactionId1,
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
        expect(await this.user1SQRpProRata.getDepositNonce(this.user1Address)).eq(0);
        expect(await this.user2SQRpProRata.getDepositNonce(this.user2Address)).eq(0);
        expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(contractConfig.goal);
      });

      it('user1 tries to call depositSig with zero amount', async function () {
        const signature = await signMessageForSQRpProRataDeposit(
          this.owner2,
          this.user1Address,
          seedData.zero,
          false,
          seedData.depositNonce1_0,
          seedData.transactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            seedData.zero,
            false,
            seedData.transactionId1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.amountNotZero);
      });

      it('user1 tries to call depositSig without allowance', async function () {
        const signature = await signMessageForSQRpProRataDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          false,
          seedData.depositNonce1_0,
          seedData.transactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            seedData.deposit1,
            false,
            seedData.transactionId1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.userMustAllowToUseFunds);
      });

      it('user1 tries to call depositSig in timeout case 1m', async function () {
        await time.increaseTo(seedData.startDatePlus1m);

        const signature = await signMessageForSQRpProRataDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          false,
          seedData.depositNonce1_0,
          seedData.transactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            seedData.deposit1,
            false,
            seedData.transactionId1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.timeoutBlocker);
      });

      it('user1 tries to call depositSig with wrong signature', async function () {
        const wrongSignature = await signMessageForSQRpProRataDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          false,
          seedData.depositNonce1_0,
          seedData.transactionIdWrong,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            seedData.deposit1,
            false,
            seedData.transactionId1,
            seedData.startDatePlus1m,
            wrongSignature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.invalidSignature);
      });

      it('user1 tries to call depositSig with allowance but no funds', async function () {
        await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

        const signature = await signMessageForSQRpProRataDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          false,
          seedData.depositNonce1_0,
          seedData.transactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1SQRpProRata.depositSig(
            seedData.deposit1,
            false,
            seedData.transactionId1,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.userMustHaveFunds);
      });

      it('user2 tries to call depositSig without allowance', async function () {
        const signature = await signMessageForSQRpProRataDeposit(
          this.owner2,
          this.user2Address,
          seedData.deposit2,
          false,
          seedData.depositNonce2_0,
          seedData.transactionId2,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user2SQRpProRata.depositSig(
            seedData.deposit2,
            false,
            seedData.transactionId2,
            seedData.startDatePlus1m,
            signature,
          ),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.userMustAllowToUseFunds);
      });

      describe('user1 and user2 have tokens and approved contract to use these tokens', () => {
        beforeEach(async function () {
          await transferToUserAndApproveForContract(
            this,
            this.user1BaseToken,
            this.user1Address,
            seedData.deposit1,
          );
          await transferToUserAndApproveForContract(
            this,
            this.user2BaseToken,
            this.user2Address,
            seedData.deposit2,
          );
        });

        it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
          expect(await getBaseTokenBalance(this, this.owner2Address)).closeTo(
            tokenConfig.initMint - BigInt(2) * seedData.userInitBalance,
            seedData.balanceDelta,
          );
          expect(await getBaseTokenBalance(this, this.user1Address)).eq(seedData.userInitBalance);
          expect(await getBaseTokenBalance(this, this.user2Address)).eq(seedData.userInitBalance);
        });

        it('user1 tries to call twice with the same time and signature', async function () {
          await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

          const signature = await signMessageForSQRpProRataDeposit(
            this.owner2,
            this.user1Address,
            seedData.deposit1,
            false,
            seedData.depositNonce1_0,
            seedData.transactionId1,
            seedData.startDatePlus1m,
          );

          const depositSig = () =>
            this.user1SQRpProRata.depositSig(
              seedData.deposit1,
              false,
              seedData.transactionId1,
              seedData.startDatePlus1m,
              signature,
            );

          await expect(Promise.all([depositSig(), depositSig()])).revertedWithCustomError(
            this.owner2SQRpProRata,
            customError.invalidSignature,
          );
        });

        it('user1 is allowed to deposit (check event)', async function () {
          const signature = await signMessageForSQRpProRataDeposit(
            this.owner2,
            this.user1Address,
            seedData.deposit1,
            false,
            seedData.depositNonce1_0,
            seedData.transactionId1,
            seedData.startDatePlus1m,
          );

          const receipt = await waitTx(
            this.user1SQRpProRata.depositSig(
              seedData.deposit1,
              false,
              seedData.transactionId1,
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

        describe('user1 deposit funds', () => {
          beforeEach(async function () {
            await depositSig({
              context: this,
              userSQRpProRata: this.user1SQRpProRata,
              userAddress: this.user1Address,
              deposit: seedData.deposit1,
              transactionId: seedData.transactionId1,
              timestampLimit: seedData.startDatePlus1m,
            });
          });

          it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
            expect(await this.owner2SQRpProRata.getUserCount()).eq(1);
            expect(await getBaseTokenBalance(this, this.user1Address)).eq(
              seedData.userInitBalance - seedData.deposit1,
            );
            expect(await this.owner2SQRpProRata.balanceOf(this.user1Address)).eq(seedData.deposit1);
            expect(await this.owner2SQRpProRata.calculateOverfundAmount()).eq(seedData.zero);
            expect(await this.owner2SQRpProRata.calculateAccountRefundAmount(this.user1Address)).eq(
              seedData.zero,
            );

            const user = await this.user1SQRpProRata.fetchUser(this.user1Address);
            expect(user.depositedAmount).eq(seedData.deposit1);

            expect(await this.owner2SQRpProRata.totalDeposited()).eq(seedData.deposit1);

            const transactionItem = await this.user1SQRpProRata.fetchTransactionItem(
              seedData.transactionId1,
            );
            expect(transactionItem.amount).eq(seedData.deposit1);

            expect(await this.user1SQRpProRata.getDepositNonce(this.user1Address)).eq(1);
            expect(await this.user2SQRpProRata.getDepositNonce(this.user2Address)).eq(0);

            expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(
              contractConfig.goal - seedData.deposit1,
            );

            expect(await this.ownerSQRpProRata.getDepositedAmount(this.user1Address)).eq(
              seedData.deposit1,
            );
            expect(await this.ownerSQRpProRata.getDepositedAmount(this.user2Address)).eq(
              seedData.zero,
            );
            expect(await this.ownerSQRpProRata.getTotalDeposited()).eq(seedData.deposit1);
          });

          it('user1 deposited again', async function () {
            await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.deposit1);

            await depositSig({
              context: this,
              userSQRpProRata: this.user1SQRpProRata,
              userAddress: this.user1Address,
              deposit: seedData.deposit1,
              transactionId: seedData.transactionId1_2,
              timestampLimit: seedData.startDatePlus1m,
            });

            const user1Deposit = BigInt(2) * seedData.deposit1;

            expect(await this.owner2SQRpProRata.getUserCount()).eq(1);
            expect(await this.owner2SQRpProRata.totalDeposited()).eq(user1Deposit);

            expect(await this.ownerSQRpProRata.getDepositedAmount(this.user1Address)).eq(
              user1Deposit,
            );
            expect(await this.ownerSQRpProRata.getDepositedAmount(this.user2Address)).eq(
              seedData.zero,
            );
            expect(await this.ownerSQRpProRata.getTotalDeposited()).eq(user1Deposit);
          });

          describe(`set time after close date when goal wasn't reached`, () => {
            beforeEach(async function () {
              await time.increaseTo(
                addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift),
              );
            });

            it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
              expect(
                await this.owner2SQRpProRata.calculateAccountRefundAmount(this.user1Address),
              ).eq(seedData.deposit1);
              expect(
                await this.owner2SQRpProRata.calculateAccountRefundAmount(this.user2Address),
              ).eq(seedData.zero);

              expect(await this.owner2SQRpProRata.isReady()).eq(false);
            });

            it('owner2 tries to withdraw unreached goal', async function () {
              await expect(this.owner2SQRpProRata.withdrawGoal()).revertedWithCustomError(
                this.owner2SQRpProRata,
                customError.goalUnreached,
              );
            });
          });

          it('user1 tries to call depositSig with the same transactionId', async function () {
            await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

            const signature = await signMessageForSQRpProRataDeposit(
              this.owner2,
              this.user1Address,
              seedData.deposit1,
              false,
              seedData.depositNonce1_1,
              seedData.transactionId1,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1SQRpProRata.depositSig(
                seedData.deposit1,
                false,
                seedData.transactionId1,
                seedData.startDatePlus1m,
                signature,
              ),
            ).revertedWithCustomError(this.owner2SQRpProRata, customError.usedTransactionId);
          });

          describe('user2 deposit funds', () => {
            beforeEach(async function () {
              await depositSig({
                context: this,
                userSQRpProRata: this.user2SQRpProRata,
                userAddress: this.user2Address,
                deposit: seedData.deposit2,
                transactionId: seedData.transactionId2,
                timestampLimit: seedData.startDatePlus1m,
              });
            });

            it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
              expect(await this.owner2SQRpProRata.getUserCount()).eq(2);
              expect(await getBaseTokenBalance(this, this.user2Address)).eq(
                seedData.userInitBalance - seedData.deposit2,
              );
              expect(await this.owner2SQRpProRata.balanceOf(this.user2Address)).eq(
                seedData.deposit2,
              );
              expect(await this.owner2SQRpProRata.calculateOverfundAmount()).eq(
                seedData.deposit1 + seedData.deposit2 - contractConfig.goal,
              );
              expect(
                await this.owner2SQRpProRata.calculateAccountRefundAmount(this.user1Address),
              ).eq(seedData.zero);

              const user = await this.user1SQRpProRata.fetchUser(this.user1Address);
              expect(user.depositedAmount).eq(seedData.deposit1);

              expect(await this.owner2SQRpProRata.totalDeposited()).eq(seedData.deposit12);

              const transactionItem = await this.user1SQRpProRata.fetchTransactionItem(
                seedData.transactionId1,
              );
              expect(transactionItem.amount).eq(seedData.deposit1);

              expect(await this.user1SQRpProRata.getDepositNonce(this.user1Address)).eq(1);
              expect(await this.user2SQRpProRata.getDepositNonce(this.user2Address)).eq(1);

              expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);

              expect(await this.ownerSQRpProRata.getDepositedAmount(this.user1Address)).eq(
                seedData.deposit1,
              );
              expect(await this.ownerSQRpProRata.getDepositedAmount(this.user2Address)).eq(
                seedData.deposit2,
              );
              expect(await this.ownerSQRpProRata.getTotalDeposited()).eq(seedData.deposit12);
            });

            it('owner2 tries to refund tokens for first user to early', async function () {
              await expect(this.owner2SQRpProRata.refund(1)).revertedWithCustomError(
                this.owner2SQRpProRata,
                customError.tooEarly,
              );
            });

            describe('set time after close date when goal was reached', () => {
              beforeEach(async function () {
                await time.increaseTo(
                  addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift),
                );
              });

              it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                expect(
                  await this.owner2SQRpProRata.calculateAccountRefundAmount(this.user1Address),
                ).closeTo(
                  calculateAccountRefundAmount(
                    contractConfig.goal,
                    seedData.deposit1,
                    seedData.deposit12,
                  ),
                  seedData.balanceDelta,
                );
                expect(
                  await this.owner2SQRpProRata.calculateAccountRefundAmount(this.user2Address),
                ).closeTo(
                  calculateAccountRefundAmount(
                    contractConfig.goal,
                    seedData.deposit2,
                    seedData.deposit12,
                  ),
                  seedData.balanceDelta,
                );

                expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);
              });

              it('owner is allowed to withdraw goal (check event)', async function () {
                const receipt = await waitTx(this.owner2SQRpProRata.withdrawGoal());
                const eventLog = findEvent<WithdrawGoalEventArgs>(receipt);

                expect(eventLog).not.undefined;
                const [account, amount] = eventLog?.args;
                expect(account).eq(this.owner2Address);
                expect(amount).eq(contractConfig.goal);
              });

              it('owner2 refunded tokens for first user (check event)', async function () {
                const receipt = await waitTx(this.owner2SQRpProRata.refund(seedData.batchSize));

                const eventLog = findEvent<RefundEventArgs>(receipt);

                expect(eventLog).not.undefined;
                const [account, amount] = eventLog?.args;
                expect(account).eq(this.user1Address);

                const refundAmount1 = calculateAccountRefundAmount(
                  contractConfig.goal,
                  seedData.deposit1,
                  seedData.deposit12,
                );
                expect(amount).eq(refundAmount1);

                expect(await this.owner2SQRpProRata.getProcessedUserIndex()).eq(1);
              });

              it('user1 tries to refund tokens for first user', async function () {
                await expect(
                  this.user1SQRpProRata.refund(seedData.batchSize),
                ).revertedWithCustomError(
                  this.owner2SQRpProRata,
                  customError.ownableUnauthorizedAccount,
                );
              });

              describe('owner2 refunded tokens for all user', () => {
                beforeEach(async function () {
                  await this.owner2SQRpProRata.refundAll();
                });

                it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                  expect(await this.owner2SQRpProRata.getProcessedUserIndex()).eq(2);

                  expect(await getBaseTokenBalance(this, this.sqrpProRataAddress)).closeTo(
                    contractConfig.goal,
                    seedData.balanceDelta,
                  );

                  const refundAmount1 = calculateAccountRefundAmount(
                    contractConfig.goal,
                    seedData.deposit1,
                    seedData.deposit12,
                  );
                  expect(await getBaseTokenBalance(this, this.user1Address)).closeTo(
                    seedData.userInitBalance - seedData.deposit1 + refundAmount1,
                    seedData.balanceDelta,
                  );

                  const refundAmount2 = calculateAccountRefundAmount(
                    contractConfig.goal,
                    seedData.deposit2,
                    seedData.deposit12,
                  );
                  expect(await getBaseTokenBalance(this, this.user2Address)).closeTo(
                    seedData.userInitBalance - seedData.deposit2 + refundAmount2,
                    seedData.balanceDelta,
                  );

                  expect(await this.ownerSQRpProRata.getDepositedAmount(this.user1Address)).eq(
                    seedData.deposit1,
                  );
                  expect(await this.ownerSQRpProRata.getDepositedAmount(this.user2Address)).eq(
                    seedData.deposit2,
                  );
                  expect(await this.ownerSQRpProRata.getTotalDeposited()).eq(seedData.deposit12);
                });

                it('owner2 tries to call withdrawGoal again', async function () {
                  await expect(this.owner2SQRpProRata.refundAll()).revertedWithCustomError(
                    this.owner2SQRpProRata,
                    customError.allUsersProcessed,
                  );
                });

                it('owner is allowed to withdraw goal (check event)', async function () {
                  const receipt = await waitTx(this.owner2SQRpProRata.withdrawGoal());
                  const eventLog = findEvent<WithdrawGoalEventArgs>(receipt);

                  expect(eventLog).not.undefined;
                  const [account, amount] = eventLog?.args;
                  expect(account).eq(this.owner2Address);
                  expect(amount).eq(contractConfig.goal);
                });

                describe('owner2 withdrew goal', () => {
                  beforeEach(async function () {
                    await this.owner2SQRpProRata.withdrawGoal();
                  });

                  it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                    expect(await getBaseTokenBalance(this, this.owner2Address)).closeTo(
                      tokenConfig.initMint -
                        BigInt(2) * seedData.userInitBalance +
                        contractConfig.goal,
                      seedData.balanceDelta,
                    );

                    expect(await this.ownerSQRpProRata.getDepositedAmount(this.user1Address)).eq(
                      seedData.deposit1,
                    );
                    expect(await this.ownerSQRpProRata.getDepositedAmount(this.user2Address)).eq(
                      seedData.deposit2,
                    );
                    expect(await this.ownerSQRpProRata.getTotalDeposited()).eq(seedData.deposit12);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}
