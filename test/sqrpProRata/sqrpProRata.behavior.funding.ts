import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { INITIAL_POSITIVE_CHECK_TEST_TITLE } from '~common';
import { waitTx } from '~common-contract';
import { contractConfig, seedData, tokenConfig } from '~seeds';
import { addSecondsToUnixTime, calculateAccountRefundAmount, signMessageForDeposit } from '~utils';
import { customError } from './testData';
import { DepositEventArgs } from './types';
import {
  checkTotalSQRBalance,
  findEvent,
  getBaseTokenBalance,
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

    it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
      expect(await getBaseTokenBalance(this, this.owner2Address)).eq(tokenConfig.initMint);
      expect(await getBaseTokenBalance(this, this.user1Address)).eq(seedData.zero);
      expect(await getBaseTokenBalance(this, this.user2Address)).eq(seedData.zero);
      expect(await getBaseTokenBalance(this, this.sqrpProRataAddress)).eq(seedData.zero);

      expect(await this.owner2SQRpProRata.getUserCount()).eq(seedData.zero);
      expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);
      expect(await this.owner2SQRpProRata.calculateOverfundAmount()).eq(seedData.zero);
      expect(await this.owner2SQRpProRata.calculateAccountRefundAmount(this.user1Address)).eq(
        seedData.zero,
      );
      expect(await this.owner2SQRpProRata.calculateAccountRefundAmount(this.user2Address)).eq(
        seedData.zero,
      );
      expect(await this.owner2SQRpProRata.getProcessedUserIndex()).eq(0);
    });

    it('user1 tries to call depositSig too early', async function () {
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
        await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

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

      describe('user1 and user2 have tokens and approved contract to use these tokens', () => {
        beforeEach(async function () {
          await this.owner2BaseToken.transfer(this.user1Address, seedData.userInitBalance);
          await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.deposit1);

          await this.owner2BaseToken.transfer(this.user2Address, seedData.userInitBalance);
          await this.user2BaseToken.approve(this.sqrpProRataAddress, seedData.deposit2);
        });

        it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
          expect(await getBaseTokenBalance(this, this.owner2Address)).closeTo(
            tokenConfig.initMint - BigInt(2) * seedData.userInitBalance,
            seedData.balanceDelta,
          );
          expect(await getBaseTokenBalance(this, this.user1Address)).eq(seedData.userInitBalance);
          expect(await getBaseTokenBalance(this, this.user2Address)).eq(seedData.userInitBalance);
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
              seedData.depositTransactionId1,
            );
            expect(transactionItem.amount).eq(seedData.deposit1);

            expect(await this.user1SQRpProRata.getNonce(this.user1Address)).eq(1);
            expect(await this.user2SQRpProRata.getNonce(this.user2Address)).eq(0);
          });

          it('user1 tries to call depositSig with the same transactionId', async function () {
            await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

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

          describe('user2 deposit funds', () => {
            beforeEach(async function () {
              const nonce = await this.user1SQRpProRata.getNonce(this.user2Address);

              const signature = await signMessageForDeposit(
                this.owner2,
                this.user2Address,
                seedData.deposit2,
                Number(nonce),
                seedData.depositTransactionId2,
                seedData.startDatePlus1m,
              );

              await this.user1SQRpProRata.depositSig(
                this.user2Address,
                seedData.deposit2,
                seedData.depositTransactionId2,
                seedData.startDatePlus1m,
                signature,
              );
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
                seedData.depositTransactionId1,
              );
              expect(transactionItem.amount).eq(seedData.deposit1);

              expect(await this.user1SQRpProRata.getNonce(this.user1Address)).eq(1);
              expect(await this.user2SQRpProRata.getNonce(this.user2Address)).eq(1);
            });

            describe('set time after close date', () => {
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
              });

              describe('owner2 refunded for all user', () => {
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
                  });

                  it('test', async function () {});
                });
              });
            });
          });
        });
      });
    });
  });
}
