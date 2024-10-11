import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { INITIAL_POSITIVE_CHECK_TEST_TITLE } from '~common';
import { waitTx } from '~common-contract';
import { contractConfig, seedData, tokenConfig } from '~seeds';
import { addSecondsToUnixTime, calculateAccountRefund, signMessageForProRataDeposit } from '~utils';
import { customError } from './testData';
import {
  CalculateBaseSwappedAmountEventArgs,
  ChangeBaseGoalEventArgs,
  DepositEventArgs,
  ForceWithdrawEventArgs,
  RefundEventArgs,
  WithdrawBaseGoalEventArgs,
  WithdrawExcessTokensEventArgs,
  WithdrawSwappedAmountEventArgs,
} from './types';
import {
  checkTotalWEB3Balance,
  contractZeroCheck,
  depositSig,
  findEvent,
  getBaseContactConfig,
  getBaseTokenBalance,
  loadWEB3ProRataFixture,
  transferToUserAndApproveForContract,
} from './utils';

export function shouldBehaveCorrectFundingDefaultCase(): void {
  describe('funding: default case', () => {
    beforeEach(async function () {
      await loadWEB3ProRataFixture(this, {
        contractConfig: {
          ...getBaseContactConfig(contractConfig),
        },
      });
      await checkTotalWEB3Balance(this);
    });

    afterEach(async function () {
      await checkTotalWEB3Balance(this);
    });

    it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
      await contractZeroCheck(this);
    });

    it('user1 tries to call withdrawBaseGoal without permission', async function () {
      await expect(this.user1WEB3ProRata.withdrawBaseGoal()).revertedWithCustomError(
        this.owner2WEB3ProRata,
        customError.ownableUnauthorizedAccount,
      );
    });

    it('user1 tries to call withdrawBaseSwappedAmount without permission', async function () {
      await expect(this.user1WEB3ProRata.withdrawBaseSwappedAmount()).revertedWithCustomError(
        this.owner2WEB3ProRata,
        customError.ownableUnauthorizedAccount,
      );
    });

    it('owner2 tries to call withdrawBaseSwappedAmount too early', async function () {
      await expect(this.owner2WEB3ProRata.withdrawBaseSwappedAmount()).revertedWithCustomError(
        this.owner2WEB3ProRata,
        customError.tooEarly,
      );
    });

    it('user1 tries to call withdrawExcessTokens without permission', async function () {
      await expect(this.user1WEB3ProRata.withdrawExcessTokens()).revertedWithCustomError(
        this.owner2WEB3ProRata,
        customError.ownableUnauthorizedAccount,
      );
    });

    it('user1 tries to call withdrawExcessTokens too early', async function () {
      await expect(this.owner2WEB3ProRata.withdrawExcessTokens()).revertedWithCustomError(
        this.owner2WEB3ProRata,
        customError.tooEarly,
      );
    });

    it('user1 tries to call calculateBaseSwappedAmount without permission', async function () {
      await expect(
        this.user1WEB3ProRata.calculateBaseSwappedAmount(seedData.batchSize),
      ).revertedWithCustomError(this.owner2WEB3ProRata, customError.ownableUnauthorizedAccount);
    });

    it('owner2 tries to call calculateBaseSwappedAmount too early', async function () {
      await expect(
        this.owner2WEB3ProRata.calculateBaseSwappedAmount(seedData.batchSize),
      ).revertedWithCustomError(this.owner2WEB3ProRata, customError.tooEarly);
    });

    it('owner tries to call withdrawBaseGoal to early', async function () {
      await expect(this.owner2WEB3ProRata.withdrawBaseGoal()).revertedWithCustomError(
        this.owner2WEB3ProRata,
        customError.tooEarly,
      );
    });

    it('user1 tries to call depositSig too early', async function () {
      const signature = await signMessageForProRataDeposit(
        this.owner2,
        this.user1Address,
        seedData.deposit1,
        false,
        seedData.zero,
        seedData.depositNonce1_0,
        seedData.transactionId1,
        seedData.startDatePlus1m,
      );

      await expect(
        this.user1WEB3ProRata.depositSig({
          baseAmount: seedData.deposit1,
          boost: false,
          boostExchangeRate: seedData.zero,
          transactionId: seedData.transactionId1,
          timestampLimit: seedData.startDatePlus1m,
          signature,
        }),
      ).revertedWithCustomError(this.owner2WEB3ProRata, customError.tooEarly);
    });

    it('user1 tries to call depositSig too late', async function () {
      await time.increaseTo(addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift));

      expect(await this.owner2WEB3ProRata.calculateRemainDeposit()).eq(seedData.zero);

      const signature = await signMessageForProRataDeposit(
        this.owner2,
        this.user1Address,
        seedData.deposit1,
        false,
        seedData.zero,
        seedData.depositNonce1_0,
        seedData.transactionId1,
        seedData.closeDatePlus1m,
      );

      await expect(
        this.user1WEB3ProRata.depositSig({
          baseAmount: seedData.deposit1,
          boost: false,
          boostExchangeRate: seedData.zero,
          transactionId: seedData.transactionId1,
          timestampLimit: seedData.closeDatePlus1m,
          signature,
        }),
      ).revertedWithCustomError(this.owner2WEB3ProRata, customError.tooLate);
    });

    describe('set time after start date', () => {
      beforeEach(async function () {
        await time.increaseTo(addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift));
      });

      it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
        expect(await this.user1WEB3ProRata.getAccountDepositNonce(this.user1Address)).eq(0);
        expect(await this.user2WEB3ProRata.getAccountDepositNonce(this.user2Address)).eq(0);
        expect(await this.owner2WEB3ProRata.calculateRemainDeposit()).eq(contractConfig.baseGoal);
      });

      it('user1 tries to call forceWithdraw without permission', async function () {
        const contractAmount = await this.user1WEB3ProRata.getBaseBalance();

        await expect(
          this.user1WEB3ProRata.forceWithdraw(
            this.baseTokenAddress,
            this.user3Address,
            contractAmount,
          ),
        )
          .revertedWithCustomError(this.user1WEB3ProRata, customError.ownableUnauthorizedAccount)
          .withArgs(this.user1Address);
      });

      it('user1 tries to call changeBaseGoal without permission', async function () {
        await expect(this.user1WEB3ProRata.changeBaseGoal(seedData.newBaseGoal))
          .revertedWithCustomError(this.user1WEB3ProRata, customError.ownableUnauthorizedAccount)
          .withArgs(this.user1Address);
      });

      it('user1 tries to call depositSig with zero amount', async function () {
        const signature = await signMessageForProRataDeposit(
          this.owner2,
          this.user1Address,
          seedData.zero,
          false,
          seedData.zero,
          seedData.depositNonce1_0,
          seedData.transactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1WEB3ProRata.depositSig({
            baseAmount: seedData.zero,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId1,
            timestampLimit: seedData.startDatePlus1m,
            signature,
          }),
        ).revertedWithCustomError(this.owner2WEB3ProRata, customError.baseAmountNotZero);
      });

      it('user1 tries to call depositSig without allowance', async function () {
        const signature = await signMessageForProRataDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          false,
          seedData.zero,
          seedData.depositNonce1_0,
          seedData.transactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1WEB3ProRata.depositSig({
            baseAmount: seedData.deposit1,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId1,
            timestampLimit: seedData.startDatePlus1m,
            signature,
          }),
        ).revertedWithCustomError(this.owner2WEB3ProRata, customError.userMustAllowToUseFunds);
      });

      it('user1 tries to call depositSig in timeout case 1m', async function () {
        await time.increaseTo(seedData.startDatePlus1m);

        const signature = await signMessageForProRataDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          false,
          seedData.zero,
          seedData.depositNonce1_0,
          seedData.transactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1WEB3ProRata.depositSig({
            baseAmount: seedData.deposit1,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId1,
            timestampLimit: seedData.startDatePlus1m,
            signature,
          }),
        ).revertedWithCustomError(this.owner2WEB3ProRata, customError.timeoutBlocker);
      });

      it('user1 tries to call depositSig with wrong signature', async function () {
        const wrongSignature = await signMessageForProRataDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          false,
          seedData.zero,
          seedData.depositNonce1_0,
          seedData.transactionIdWrong,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1WEB3ProRata.depositSig({
            baseAmount: seedData.deposit1,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId1,
            timestampLimit: seedData.startDatePlus1m,
            signature: wrongSignature,
          }),
        ).revertedWithCustomError(this.owner2WEB3ProRata, customError.invalidSignature);
      });

      it('user1 tries to call depositSig with allowance but no funds', async function () {
        await this.user1BaseToken.approve(this.web3ProRataAddress, seedData.extraDeposit1);

        const signature = await signMessageForProRataDeposit(
          this.owner2,
          this.user1Address,
          seedData.deposit1,
          false,
          seedData.zero,
          seedData.depositNonce1_0,
          seedData.transactionId1,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user1WEB3ProRata.depositSig({
            baseAmount: seedData.deposit1,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId1,
            timestampLimit: seedData.startDatePlus1m,
            signature,
          }),
        ).revertedWithCustomError(this.owner2WEB3ProRata, customError.userMustHaveFunds);
      });

      it('user2 tries to call depositSig without allowance', async function () {
        const signature = await signMessageForProRataDeposit(
          this.owner2,
          this.user2Address,
          seedData.deposit2,
          false,
          seedData.zero,
          seedData.depositNonce2_0,
          seedData.transactionId2,
          seedData.startDatePlus1m,
        );

        await expect(
          this.user2WEB3ProRata.depositSig({
            baseAmount: seedData.deposit2,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId2,
            timestampLimit: seedData.startDatePlus1m,
            signature,
          }),
        ).revertedWithCustomError(this.owner2WEB3ProRata, customError.userMustAllowToUseFunds);
      });

      describe('user1 and user2 have tokens and approved contract to use these tokens', () => {
        beforeEach(async function () {
          await transferToUserAndApproveForContract(
            this,
            this.owner2BaseToken,
            this.user1BaseToken,
            this.user1Address,
            seedData.userInitBalance,
          );
          await transferToUserAndApproveForContract(
            this,
            this.owner2BaseToken,
            this.user2BaseToken,
            this.user2Address,
            seedData.userInitBalance,
          );
        });

        it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
          expect(await getBaseTokenBalance(this, this.owner2Address)).closeTo(
            tokenConfig.initMint - BigInt(2) * seedData.userInitBalance,
            seedData.baseBalanceDelta,
          );
          expect(await getBaseTokenBalance(this, this.user1Address)).eq(seedData.userInitBalance);
          expect(await getBaseTokenBalance(this, this.user2Address)).eq(seedData.userInitBalance);
        });

        it('user1 tries to call twice with the same time and signature', async function () {
          await this.user1BaseToken.approve(this.web3ProRataAddress, seedData.extraDeposit1);

          const signature = await signMessageForProRataDeposit(
            this.owner2,
            this.user1Address,
            seedData.deposit1,
            false,
            seedData.zero,
            seedData.depositNonce1_0,
            seedData.transactionId1,
            seedData.startDatePlus1m,
          );

          const depositSig = () =>
            this.user1WEB3ProRata.depositSig({
              baseAmount: seedData.deposit1,
              boost: false,
              boostExchangeRate: seedData.zero,
              transactionId: seedData.transactionId1,
              timestampLimit: seedData.startDatePlus1m,
              signature,
            });

          await expect(Promise.all([depositSig(), depositSig()])).revertedWithCustomError(
            this.owner2WEB3ProRata,
            customError.invalidSignature,
          );
        });

        it('user1 is allowed to deposit (check event)', async function () {
          const signature = await signMessageForProRataDeposit(
            this.owner2,
            this.user1Address,
            seedData.deposit1,
            false,
            seedData.zero,
            seedData.depositNonce1_0,
            seedData.transactionId1,
            seedData.startDatePlus1m,
          );

          const receipt = await waitTx(
            this.user1WEB3ProRata.depositSig({
              baseAmount: seedData.deposit1,
              boost: false,
              boostExchangeRate: seedData.zero,
              transactionId: seedData.transactionId1,
              timestampLimit: seedData.startDatePlus1m,
              signature,
            }),
          );
          const eventLog = findEvent<DepositEventArgs>(receipt);

          expect(eventLog).not.undefined;
          const [account, isBoost, baseAmount, boostDeposit] = eventLog?.args;
          expect(account).eq(this.user1Address);
          expect(isBoost).eq(false);
          expect(baseAmount).eq(seedData.deposit1);
          expect(boostDeposit).eq(seedData.zero);
        });

        describe('user1 deposited base tokens', () => {
          beforeEach(async function () {
            await depositSig({
              context: this,
              userWEB3ProRata: this.user1WEB3ProRata,
              userAddress: this.user1Address,
              baseDeposit: seedData.deposit1,
              transactionId: seedData.transactionId1,
              timestampLimit: seedData.startDatePlus1m,
            });
          });

          it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
            expect(await this.owner2WEB3ProRata.getAccountCount()).eq(1);
            expect(await getBaseTokenBalance(this, this.user1Address)).eq(
              seedData.userInitBalance - seedData.deposit1,
            );
            expect(await this.owner2WEB3ProRata.balanceOf(this.user1Address)).eql([
              seedData.deposit1,
              seedData.zero,
            ]);
            expect(await this.owner2WEB3ProRata.calculateOverfundAmount()).eq(seedData.zero);

            expect(await this.owner2WEB3ProRata.calculateAccountBaseRefund(this.user1Address)).eq(
              seedData.deposit1,
            );

            const {
              baseDeposited,
              baseDeposit,
              baseAllocation,
              baseRefunded,
              baseRefund,
              nonce,
              boosted,
            } = await this.user1WEB3ProRata.fetchAccountInfo(this.user1Address);
            expect(baseDeposited).eq(seedData.deposit1);
            expect(baseDeposit).eq(seedData.deposit1);
            expect(baseAllocation).eq(seedData.zero);
            expect(baseRefunded).eq(seedData.zero);
            expect(baseRefund).eq(seedData.deposit1);
            expect(nonce).eq(1);
            expect(boosted).eq(false);

            expect(await this.owner2WEB3ProRata.totalBaseDeposited()).eq(seedData.deposit1);

            const transactionItem = await this.user1WEB3ProRata.fetchTransactionItem(
              seedData.transactionId1,
            );
            expect(transactionItem.amount).eq(seedData.deposit1);

            expect(await this.user1WEB3ProRata.getAccountDepositNonce(this.user1Address)).eq(1);
            expect(await this.user2WEB3ProRata.getAccountDepositNonce(this.user2Address)).eq(0);

            expect(await this.owner2WEB3ProRata.calculateRemainDeposit()).eq(
              contractConfig.baseGoal - seedData.deposit1,
            );

            expect(await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user1Address)).eq(
              seedData.zero,
            );
            const {
              baseDeposited: baseDeposited1,
              boosted: boosted1,
              baseAllocation: baseAllocation1,
              baseRefund: baseRefund1,
              boostRefund: boostRefund1,
              nonce: nonce1,
            } = await this.ownerWEB3ProRata.getDepositRefundAccountInfo(this.user1Address);
            expect(baseDeposited1).eq(seedData.deposit1);
            expect(boosted1).eq(false);
            expect(baseAllocation1).eq(seedData.zero);
            expect(baseRefund1).eq(seedData.deposit1);
            expect(boostRefund1).eq(seedData.zero);
            expect(nonce1).eq(1);

            expect(await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user2Address)).eq(
              seedData.zero,
            );
            const {
              baseDeposited: baseDeposited2,
              boosted: boosted2,
              baseAllocation: baseAllocation2,
              baseRefund: baseRefund2,
              boostRefund: boostRefund2,
              nonce: nonce2,
            } = await this.ownerWEB3ProRata.getDepositRefundAccountInfo(this.user2Address);
            expect(baseDeposited2).eq(seedData.zero);
            expect(boosted2).eq(false);
            expect(baseAllocation2).eq(seedData.zero);
            expect(baseRefund2).eq(seedData.zero);
            expect(boostRefund2).eq(seedData.zero);
            expect(nonce2).eq(0);

            const { totalBaseDeposited } =
              await this.ownerWEB3ProRata.getDepositRefundContractInfo();
            expect(totalBaseDeposited).eq(await this.ownerWEB3ProRata.totalBaseDeposited());
            expect(await this.owner2WEB3ProRata.calculateAccidentAmount()).eq(seedData.zero);
            expect(await this.ownerWEB3ProRata.isReachedBaseGoal()).eq(false);
          });

          it('user1 deposited base tokens again', async function () {
            await this.user1BaseToken.approve(this.web3ProRataAddress, seedData.deposit1);

            await depositSig({
              context: this,
              userWEB3ProRata: this.user1WEB3ProRata,
              userAddress: this.user1Address,
              baseDeposit: seedData.deposit1,
              transactionId: seedData.transactionId1_2,
              timestampLimit: seedData.startDatePlus1m,
            });

            const user1Deposit = BigInt(2) * seedData.deposit1;

            expect(await this.owner2WEB3ProRata.getAccountCount()).eq(1);
            expect(await this.owner2WEB3ProRata.totalBaseDeposited()).eq(user1Deposit);

            const refund1 = calculateAccountRefund(
              contractConfig.baseGoal,
              user1Deposit,
              user1Deposit,
            );

            expect(await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user1Address)).eq(
              user1Deposit - refund1,
            );
            const {
              baseDeposited: baseDeposited1,
              boosted: boosted1,
              baseAllocation: baseAllocation1,
              baseRefund: baseRefund1,
              boostRefund: boostRefund1,
              nonce: nonce1,
            } = await this.ownerWEB3ProRata.getDepositRefundAccountInfo(this.user1Address);
            expect(baseDeposited1).eq(user1Deposit);
            expect(boosted1).eq(false);
            expect(baseAllocation1).eq(user1Deposit - refund1);
            expect(baseRefund1).eq(refund1);
            expect(boostRefund1).eq(seedData.zero);
            expect(nonce1).eq(2);

            expect(await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user2Address)).eq(
              seedData.zero,
            );
            const {
              baseDeposited: baseDeposited2,
              boosted: boosted2,
              baseAllocation: baseAllocation2,
              baseRefund: baseRefund2,
              boostRefund: boostRefund2,
              nonce: nonce2,
            } = await this.ownerWEB3ProRata.getDepositRefundAccountInfo(this.user2Address);
            expect(baseDeposited2).eq(seedData.zero);
            expect(boosted2).eq(false);
            expect(baseAllocation2).eq(seedData.zero);
            expect(baseRefund2).eq(seedData.zero);
            expect(boostRefund2).eq(seedData.zero);
            expect(nonce2).eq(0);

            const { totalBaseDeposited } =
              await this.ownerWEB3ProRata.getDepositRefundContractInfo();
            expect(totalBaseDeposited).eq(await this.ownerWEB3ProRata.totalBaseDeposited());
            expect(await this.ownerWEB3ProRata.isReachedBaseGoal()).eq(true);
          });

          it('owner2 called forceWithdraw (check event)', async function () {
            expect(await getBaseTokenBalance(this, this.user3Address)).eq(seedData.zero);

            const contractAmount = await this.owner2WEB3ProRata.getBaseBalance();

            const receipt = await waitTx(
              this.owner2WEB3ProRata.forceWithdraw(
                this.baseTokenAddress,
                this.user3Address,
                contractAmount,
              ),
            );
            const eventLog = findEvent<ForceWithdrawEventArgs>(receipt);

            expect(eventLog).not.undefined;
            const [token, to, amount] = eventLog?.args;
            expect(token).eq(this.baseTokenAddress);
            expect(to).eq(this.user3Address);
            expect(amount).closeTo(contractAmount, seedData.baseBalanceDelta);

            expect(await getBaseTokenBalance(this, this.user1Address)).eq(
              seedData.userInitBalance - seedData.deposit1,
            );
            expect(await getBaseTokenBalance(this, this.user2Address)).eq(seedData.userInitBalance);
            expect(await getBaseTokenBalance(this, this.user3Address)).eq(contractAmount);

            expect(await this.owner2WEB3ProRata.balanceOf(this.user1Address)).eql([
              seedData.deposit1,
              seedData.zero,
            ]);
            expect(await this.owner2WEB3ProRata.balanceOf(this.user2Address)).eql([
              seedData.zero,
              seedData.zero,
            ]);

            expect(await this.owner2WEB3ProRata.totalBaseDeposited()).eq(seedData.deposit1);
          });

          it('owner2 called changeBaseGoal (check event)', async function () {
            const initialBaseGoal = await this.owner2WEB3ProRata.baseGoal();

            const receipt = await waitTx(
              this.owner2WEB3ProRata.changeBaseGoal(seedData.newBaseGoal),
            );
            const eventLog = findEvent<ChangeBaseGoalEventArgs>(receipt);

            expect(eventLog).not.undefined;
            const [owner, oldBaseGoal, newBaseGoal] = eventLog?.args;
            expect(owner).eq(this.owner2Address);
            expect(oldBaseGoal).eq(initialBaseGoal);
            expect(newBaseGoal).eq(seedData.newBaseGoal);

            expect(await this.owner2WEB3ProRata.baseGoal()).eq(seedData.newBaseGoal);
          });

          describe(`set time after close date when goal wasn't reached`, () => {
            beforeEach(async function () {
              await time.increaseTo(
                addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift),
              );
            });

            it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
              expect(await this.owner2WEB3ProRata.calculateAccountBaseRefund(this.user1Address)).eq(
                seedData.deposit1,
              );
              expect(await this.owner2WEB3ProRata.calculateAccountBaseRefund(this.user2Address)).eq(
                seedData.zero,
              );

              expect(await this.owner2WEB3ProRata.isDepositReady()).eq(false);

              expect(await this.ownerWEB3ProRata.getDepositRefundFetchReady()).eq(true);
            });

            it('owner2 tries to call withdrawExcessTokens without refunding', async function () {
              await expect(this.owner2WEB3ProRata.withdrawExcessTokens()).revertedWithCustomError(
                this.owner2WEB3ProRata,
                customError.notRefunded,
              );
            });

            it('owner2 tries to withdraw unreached goal when someone accidentally sent tokens', async function () {
              expect(await this.owner2WEB3ProRata.calculateAccidentAmount()).eq(seedData.zero);

              await this.owner2BaseToken.transfer(this.web3ProRataAddress, seedData.accidentAmount);

              expect(await this.owner2WEB3ProRata.calculateAccidentAmount()).eq(
                seedData.accidentAmount,
              );

              await expect(this.owner2WEB3ProRata.withdrawBaseGoal()).revertedWithCustomError(
                this.owner2WEB3ProRata,
                customError.unreachedGoal,
              );
            });

            it('owner2 tries to withdraw unreached goal', async function () {
              await expect(this.owner2WEB3ProRata.withdrawBaseGoal()).revertedWithCustomError(
                this.owner2WEB3ProRata,
                customError.unreachedGoal,
              );
            });
          });

          it('user1 tries to call depositSig with the same transactionId', async function () {
            await this.user1BaseToken.approve(this.web3ProRataAddress, seedData.extraDeposit1);

            const signature = await signMessageForProRataDeposit(
              this.owner2,
              this.user1Address,
              seedData.deposit1,
              false,
              seedData.zero,
              seedData.depositNonce1_1,
              seedData.transactionId1,
              seedData.startDatePlus1m,
            );

            await expect(
              this.user1WEB3ProRata.depositSig({
                baseAmount: seedData.deposit1,
                boost: false,
                boostExchangeRate: seedData.zero,
                transactionId: seedData.transactionId1,
                timestampLimit: seedData.startDatePlus1m,
                signature,
              }),
            ).revertedWithCustomError(this.owner2WEB3ProRata, customError.usedTransactionId);
          });

          describe('user2 deposited base tokens', () => {
            beforeEach(async function () {
              await depositSig({
                context: this,
                userWEB3ProRata: this.user2WEB3ProRata,
                userAddress: this.user2Address,
                baseDeposit: seedData.deposit2,
                transactionId: seedData.transactionId2,
                timestampLimit: seedData.startDatePlus1m,
              });
            });

            it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
              expect(await this.owner2WEB3ProRata.getAccountCount()).eq(2);
              expect(await getBaseTokenBalance(this, this.user2Address)).eq(
                seedData.userInitBalance - seedData.deposit2,
              );
              expect(await this.owner2WEB3ProRata.balanceOf(this.user2Address)).eql([
                seedData.deposit2,
                seedData.zero,
              ]);
              expect(await this.owner2WEB3ProRata.calculateOverfundAmount()).eq(
                seedData.deposit1 + seedData.deposit2 - contractConfig.baseGoal,
              );

              const refund1 = calculateAccountRefund(
                contractConfig.baseGoal,
                seedData.deposit1,
                seedData.deposit12,
              );

              expect(await this.owner2WEB3ProRata.calculateAccountBaseRefund(this.user1Address)).eq(
                refund1,
              );

              const refund2 = calculateAccountRefund(
                contractConfig.baseGoal,
                seedData.deposit2,
                seedData.deposit12,
              );

              expect(await this.owner2WEB3ProRata.calculateAccountBaseRefund(this.user2Address)).eq(
                refund2,
              );

              const {
                baseDeposited,
                baseDeposit,
                baseAllocation,
                baseRefunded,
                baseRefund,
                nonce,
                boosted,
              } = await this.user1WEB3ProRata.fetchAccountInfo(this.user1Address);
              expect(baseDeposited).eq(seedData.deposit1);
              expect(baseDeposit).eq(seedData.deposit1);
              expect(baseAllocation).eq(seedData.deposit1 - refund1);
              expect(baseRefunded).eq(seedData.zero);
              expect(baseRefund).eq(refund1);
              expect(nonce).eq(1);
              expect(boosted).eq(false);

              expect(await this.owner2WEB3ProRata.totalBaseDeposited()).eq(seedData.deposit12);

              const transactionItem = await this.user1WEB3ProRata.fetchTransactionItem(
                seedData.transactionId1,
              );
              expect(transactionItem.amount).eq(seedData.deposit1);

              expect(await this.user1WEB3ProRata.getAccountDepositNonce(this.user1Address)).eq(1);
              expect(await this.user2WEB3ProRata.getAccountDepositNonce(this.user2Address)).eq(1);

              expect(await this.owner2WEB3ProRata.calculateRemainDeposit()).eq(seedData.zero);

              expect(await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user1Address)).eq(
                seedData.deposit1 - refund1,
              );
              const {
                baseDeposited: baseDeposited1,
                boosted: boosted1,
                baseAllocation: baseAllocation1,
                baseRefund: baseRefund1,
                boostRefund: boostRefund1,
                nonce: nonce1,
              } = await this.ownerWEB3ProRata.getDepositRefundAccountInfo(this.user1Address);
              expect(baseDeposited1).eq(seedData.deposit1);
              expect(boosted1).eq(false);
              expect(baseAllocation1).eq(seedData.deposit1 - refund1);
              expect(baseRefund1).eq(refund1);
              expect(boostRefund1).eq(seedData.zero);
              expect(nonce1).eq(1);

              expect(await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user2Address)).eq(
                seedData.deposit2 - refund2,
              );
              expect(await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user2Address)).eq(
                seedData.deposit2 - refund2,
              );
              const {
                baseDeposited: baseDeposited2,
                boosted: boosted2,
                baseAllocation: baseAllocation2,
                baseRefund: baseRefund2,
                boostRefund: boostRefund2,
                nonce: nonce2,
              } = await this.ownerWEB3ProRata.getDepositRefundAccountInfo(this.user2Address);
              expect(baseDeposited2).eq(seedData.deposit2);
              expect(boosted2).eq(false);
              expect(baseAllocation2).eq(seedData.deposit2 - refund2);
              expect(baseRefund2).eq(refund2);
              expect(boostRefund2).eq(seedData.zero);
              expect(nonce2).eq(1);

              const { totalBaseDeposited } =
                await this.ownerWEB3ProRata.getDepositRefundContractInfo();
              expect(totalBaseDeposited).eq(await this.ownerWEB3ProRata.totalBaseDeposited());
              expect(await this.owner2WEB3ProRata.calculateAccidentAmount()).eq(seedData.zero);
              expect(await this.ownerWEB3ProRata.isReachedBaseGoal()).eq(true);
            });

            it('owner2 tries to refund tokens for first user too early', async function () {
              await expect(this.owner2WEB3ProRata.refund(1)).revertedWithCustomError(
                this.owner2WEB3ProRata,
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
                  await this.owner2WEB3ProRata.calculateAccountBaseRefund(this.user1Address),
                ).closeTo(
                  calculateAccountRefund(
                    contractConfig.baseGoal,
                    seedData.deposit1,
                    seedData.deposit12,
                  ),
                  seedData.baseBalanceDelta,
                );
                expect(
                  await this.owner2WEB3ProRata.calculateAccountBaseRefund(this.user2Address),
                ).closeTo(
                  calculateAccountRefund(
                    contractConfig.baseGoal,
                    seedData.deposit2,
                    seedData.deposit12,
                  ),
                  seedData.baseBalanceDelta,
                );

                expect(await this.owner2WEB3ProRata.calculateRemainDeposit()).eq(seedData.zero);

                const refund1 = calculateAccountRefund(
                  contractConfig.baseGoal,
                  seedData.deposit1,
                  seedData.deposit12,
                );
                expect(await getBaseTokenBalance(this, this.user1Address)).closeTo(
                  seedData.userInitBalance - seedData.deposit1,
                  seedData.baseBalanceDelta,
                );

                const refund2 = calculateAccountRefund(
                  contractConfig.baseGoal,
                  seedData.deposit2,
                  seedData.deposit12,
                );
                expect(await getBaseTokenBalance(this, this.user2Address)).closeTo(
                  seedData.userInitBalance - seedData.deposit2,
                  seedData.baseBalanceDelta,
                );

                const user1 = await this.user1WEB3ProRata.fetchAccountInfo(this.user1Address);
                expect(user1.baseDeposited).eq(seedData.deposit1);
                expect(user1.baseDeposit).eq(seedData.deposit1);
                expect(user1.baseAllocation).eq(seedData.deposit1 - refund1);
                expect(user1.baseRefund).eq(refund1);
                expect(user1.baseRefunded).eq(seedData.zero);
                expect(user1.nonce).eq(1);
                expect(user1.boosted).eq(false);

                const user2 = await this.user2WEB3ProRata.fetchAccountInfo(this.user2Address);
                expect(user2.baseDeposited).eq(seedData.deposit2);
                expect(user2.baseDeposit).eq(seedData.deposit2);
                expect(user2.baseAllocation).eq(seedData.deposit2 - refund2);
                expect(user2.baseRefund).eq(refund2);
                expect(user2.baseRefunded).eq(seedData.zero);
                expect(user2.nonce).eq(1);
                expect(user2.boosted).eq(false);

                expect(await this.ownerWEB3ProRata.calculateTotalRefundTokensAll()).eql([
                  refund1 + refund2,
                  seedData.zero,
                ]);
              });

              it('owner2 is allowed to call calculateBaseSwappedAmountAll (check event)', async function () {
                const receipt = await waitTx(
                  this.owner2WEB3ProRata.calculateBaseSwappedAmountAll(),
                );
                const eventLog = findEvent<CalculateBaseSwappedAmountEventArgs>(receipt);

                expect(eventLog).not.undefined;
                const [batchSize, endIndex] = eventLog?.args;
                const accountCount = await this.owner2WEB3ProRata.getAccountCount();
                expect(batchSize).eq(accountCount);
                expect(endIndex).eq(accountCount);

                expect(await this.owner2WEB3ProRata.getProcessedBaseSwappedIndex()).eq(
                  accountCount,
                );
              });

              describe('owner2 called calculateBaseSwappedAmountAll', () => {
                beforeEach(async function () {
                  await this.owner2WEB3ProRata.calculateBaseSwappedAmountAll();
                });

                it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                  const accountCount = await this.owner2WEB3ProRata.getAccountCount();
                  expect(await this.owner2WEB3ProRata.getProcessedBaseSwappedIndex()).eq(
                    accountCount,
                  );
                });

                it('owner2 tries to call allUsersProcessedBaseSwapped which was processed', async function () {
                  await expect(
                    this.owner2WEB3ProRata.calculateBaseSwappedAmount(seedData.batchSize),
                  ).revertedWithCustomError(
                    this.owner2WEB3ProRata,
                    customError.allUsersProcessedBaseSwapped,
                  );
                });

                it('owner2 is allowed to call withdrawBaseSwappedAmount (check event)', async function () {
                  const receipt = await waitTx(this.owner2WEB3ProRata.withdrawBaseSwappedAmount());
                  const eventLog = findEvent<WithdrawSwappedAmountEventArgs>(receipt);

                  expect(eventLog).not.undefined;
                  const [account, baseAmount] = eventLog?.args;
                  expect(account).eq(this.owner2Address);
                  expect(baseAmount).eq(seedData.zero);
                });

                it('owner2 tries to call withdrawBaseSwappedAmount twice', async function () {
                  await this.owner2WEB3ProRata.withdrawBaseSwappedAmount();

                  await expect(
                    this.owner2WEB3ProRata.withdrawBaseSwappedAmount(),
                  ).revertedWithCustomError(
                    this.owner2WEB3ProRata,
                    customError.withdrewBaseSwappedAmount,
                  );
                });
              });

              it('owner is allowed to withdraw goal (check event)', async function () {
                const receipt = await waitTx(this.owner2WEB3ProRata.withdrawBaseGoal());
                const eventLog = findEvent<WithdrawBaseGoalEventArgs>(receipt);

                expect(eventLog).not.undefined;
                const [account, amount] = eventLog?.args;
                expect(account).eq(this.owner2Address);
                expect(amount).eq(contractConfig.baseGoal);
              });

              it('owner2 refunded tokens for first user (check event)', async function () {
                const receipt = await waitTx(this.owner2WEB3ProRata.refund(seedData.batchSize));

                const eventLog = findEvent<RefundEventArgs>(receipt);

                expect(eventLog).not.undefined;
                const [account, isBoost, baseRefund, boostRefund] = eventLog?.args;
                expect(account).eq(this.user1Address);
                expect(isBoost).eq(false);

                const refund1 = calculateAccountRefund(
                  contractConfig.baseGoal,
                  seedData.deposit1,
                  seedData.deposit12,
                );
                expect(baseRefund).eq(refund1);
                expect(boostRefund).eq(seedData.zero);

                expect(await this.owner2WEB3ProRata.getProcessedRefundIndex()).eq(1);
              });

              it('user1 tries to refund tokens for first user', async function () {
                await expect(
                  this.user1WEB3ProRata.refund(seedData.batchSize),
                ).revertedWithCustomError(
                  this.owner2WEB3ProRata,
                  customError.ownableUnauthorizedAccount,
                );
              });

              it('check calculateAccidentAmount', async function () {
                expect(await this.owner2WEB3ProRata.calculateAccidentAmount()).eq(seedData.zero);
                await this.owner2BaseToken.transfer(
                  this.web3ProRataAddress,
                  seedData.accidentAmount,
                );
                expect(await this.owner2WEB3ProRata.calculateAccidentAmount()).eq(
                  seedData.accidentAmount,
                );
                await this.owner2WEB3ProRata.refundAll();

                expect(await this.owner2WEB3ProRata.calculateAccidentAmount()).eq(
                  seedData.accidentAmount,
                );

                await this.owner2WEB3ProRata.withdrawBaseGoal();

                expect(await this.owner2WEB3ProRata.calculateAccidentAmount()).eq(
                  seedData.accidentAmount,
                );
              });

              describe('owner2 refunded tokens for all user', () => {
                beforeEach(async function () {
                  await this.owner2WEB3ProRata.refundAll();
                });

                it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                  expect(await this.owner2WEB3ProRata.getProcessedRefundIndex()).eq(2);

                  expect(await getBaseTokenBalance(this, this.web3ProRataAddress)).closeTo(
                    contractConfig.baseGoal,
                    seedData.baseBalanceDelta,
                  );

                  const refund1 = calculateAccountRefund(
                    contractConfig.baseGoal,
                    seedData.deposit1,
                    seedData.deposit12,
                  );
                  expect(await getBaseTokenBalance(this, this.user1Address)).closeTo(
                    seedData.userInitBalance - seedData.deposit1 + refund1,
                    seedData.baseBalanceDelta,
                  );

                  const refund2 = calculateAccountRefund(
                    contractConfig.baseGoal,
                    seedData.deposit2,
                    seedData.deposit12,
                  );
                  expect(await getBaseTokenBalance(this, this.user2Address)).closeTo(
                    seedData.userInitBalance - seedData.deposit2 + refund2,
                    seedData.baseBalanceDelta,
                  );

                  expect(
                    await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user1Address),
                  ).eq(seedData.deposit1 - refund1);
                  const {
                    baseDeposited: baseDeposited1,
                    boosted: boosted1,
                    baseAllocation: baseAllocation1,
                    baseRefund: baseRefund1,
                    boostRefund: boostRefund1,
                    nonce: nonce1,
                  } = await this.ownerWEB3ProRata.getDepositRefundAccountInfo(this.user1Address);
                  expect(baseDeposited1).eq(seedData.deposit1);
                  expect(boosted1).eq(false);
                  expect(baseAllocation1).eq(seedData.deposit1 - refund1);
                  expect(baseRefund1).eq(refund1);
                  expect(boostRefund1).eq(seedData.zero);
                  expect(nonce1).eq(1);

                  expect(
                    await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user2Address),
                  ).eq(seedData.deposit2 - refund2);
                  const {
                    baseDeposited: baseDeposited2,
                    boosted: boosted2,
                    baseAllocation: baseAllocation2,
                    baseRefund: baseRefund2,
                    boostRefund: boostRefund2,
                    nonce: nonce2,
                  } = await this.ownerWEB3ProRata.getDepositRefundAccountInfo(this.user2Address);
                  expect(baseDeposited2).eq(seedData.deposit2);
                  expect(boosted2).eq(false);
                  expect(baseAllocation2).eq(seedData.deposit2 - refund2);
                  expect(baseRefund2).eq(refund2);
                  expect(boostRefund2).eq(seedData.zero);
                  expect(nonce2).eq(1);

                  const { totalBaseDeposited } =
                    await this.ownerWEB3ProRata.getDepositRefundContractInfo();
                  expect(totalBaseDeposited).eq(await this.ownerWEB3ProRata.totalBaseDeposited());

                  expect(await this.owner2WEB3ProRata.calculateAccidentAmount()).eq(seedData.zero);

                  expect(await this.owner2WEB3ProRata.totalBaseRefunded()).eq(refund1 + refund2);

                  const user1 = await this.user1WEB3ProRata.fetchAccountInfo(this.user1Address);
                  expect(user1.baseDeposit).eq(seedData.deposit1);
                  expect(user1.baseAllocation).eq(seedData.deposit1 - refund1);
                  expect(user1.baseRefund).eq(refund1);
                  expect(user1.nonce).eq(1);
                  expect(user1.boosted).eq(false);

                  const user2 = await this.user2WEB3ProRata.fetchAccountInfo(this.user2Address);
                  expect(user2.baseDeposit).eq(seedData.deposit2);
                  expect(user2.baseAllocation).eq(seedData.deposit2 - refund2);
                  expect(user2.baseRefund).eq(refund2);
                  expect(user2.nonce).eq(1);
                  expect(user2.boosted).eq(false);
                });

                it('owner2 tries to call withdrawBaseGoal again', async function () {
                  await expect(this.owner2WEB3ProRata.refundAll()).revertedWithCustomError(
                    this.owner2WEB3ProRata,
                    customError.allUsersProcessedRefund,
                  );
                });

                it('owner2 tries to call withdrawExcessTokens without withdrawing base goal', async function () {
                  await expect(
                    this.owner2WEB3ProRata.withdrawExcessTokens(),
                  ).revertedWithCustomError(
                    this.owner2WEB3ProRata,
                    customError.notWithdrawBaseGoal,
                  );
                });

                it('owner is allowed to withdraw goal (check event)', async function () {
                  const receipt = await waitTx(this.owner2WEB3ProRata.withdrawBaseGoal());
                  const eventLog = findEvent<WithdrawBaseGoalEventArgs>(receipt);

                  expect(eventLog).not.undefined;
                  const [account, amount] = eventLog?.args;
                  expect(account).eq(this.owner2Address);
                  expect(amount).eq(contractConfig.baseGoal);
                });

                describe('owner2 withdrew goal', () => {
                  beforeEach(async function () {
                    await this.owner2WEB3ProRata.withdrawBaseGoal();
                  });

                  it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                    expect(await getBaseTokenBalance(this, this.owner2Address)).closeTo(
                      tokenConfig.initMint -
                        BigInt(2) * seedData.userInitBalance +
                        contractConfig.baseGoal,
                      seedData.baseBalanceDelta,
                    );

                    const refund1 = calculateAccountRefund(
                      contractConfig.baseGoal,
                      seedData.deposit1,
                      seedData.deposit12,
                    );
                    expect(
                      await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user1Address),
                    ).eq(seedData.deposit1 - refund1);
                    const {
                      baseDeposited: baseDeposited1,
                      boosted: boosted1,
                      baseAllocation: baseAllocation1,
                      baseRefund: baseRefund1,
                      boostRefund: boostRefund1,
                      nonce: nonce1,
                    } = await this.ownerWEB3ProRata.getDepositRefundAccountInfo(this.user1Address);
                    expect(baseDeposited1).eq(seedData.deposit1);
                    expect(boosted1).eq(false);
                    expect(baseAllocation1).eq(seedData.deposit1 - refund1);
                    expect(baseRefund1).eq(refund1);
                    expect(boostRefund1).eq(seedData.zero);
                    expect(nonce1).eq(1);

                    const refund2 = calculateAccountRefund(
                      contractConfig.baseGoal,
                      seedData.deposit2,
                      seedData.deposit12,
                    );
                    expect(
                      await this.ownerWEB3ProRata.getDepositRefundAllocation(this.user2Address),
                    ).eq(seedData.deposit2 - refund2);
                    const {
                      baseDeposited: baseDeposited2,
                      boosted: boosted2,
                      baseAllocation: baseAllocation2,
                      baseRefund: baseRefund2,
                      boostRefund: boostRefund2,
                      nonce: nonce2,
                    } = await this.ownerWEB3ProRata.getDepositRefundAccountInfo(this.user2Address);
                    expect(baseDeposited2).eq(seedData.deposit2);
                    expect(boosted2).eq(false);
                    expect(baseAllocation2).eq(seedData.deposit2 - refund2);
                    expect(baseRefund2).eq(refund2);
                    expect(boostRefund2).eq(seedData.zero);
                    expect(nonce2).eq(1);

                    const { totalBaseDeposited } =
                      await this.ownerWEB3ProRata.getDepositRefundContractInfo();
                    expect(totalBaseDeposited).eq(await this.ownerWEB3ProRata.totalBaseDeposited());
                    expect(await this.ownerWEB3ProRata.totalBaseWithdrew()).eq(
                      contractConfig.baseGoal,
                    );
                  });

                  it('owner2 tries to withdrew goal again', async function () {
                    await expect(this.owner2WEB3ProRata.withdrawBaseGoal()).revertedWithCustomError(
                      this.owner2WEB3ProRata,
                      customError.alreadyWithdrewBaseGoal,
                    );
                  });

                  it('owner is allowed to withdraw goal (check event)', async function () {
                    await this.owner2BaseToken.transfer(
                      this.web3ProRataAddress,
                      seedData.extraDeposit1,
                    );
                    await this.owner2BoostToken.transfer(
                      this.web3ProRataAddress,
                      seedData.extraDeposit2,
                    );

                    const baseBalance = await this.owner2WEB3ProRata.getBaseBalance();
                    const boostBalance = await this.owner2WEB3ProRata.getBoostBalance();

                    const receipt = await waitTx(this.owner2WEB3ProRata.withdrawExcessTokens());
                    const eventLog = findEvent<WithdrawExcessTokensEventArgs>(receipt);

                    expect(eventLog).not.undefined;
                    const [account, baseAmount, boostDeposit] = eventLog?.args;
                    expect(account).eq(this.owner2Address);

                    expect(baseAmount).eq(baseBalance);
                    expect(boostDeposit).eq(boostBalance);
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
