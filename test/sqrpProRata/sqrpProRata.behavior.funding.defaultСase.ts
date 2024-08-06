import { time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { INITIAL_POSITIVE_CHECK_TEST_TITLE } from '~common';
import { waitTx } from '~common-contract';
import { contractConfig, seedData, tokenConfig } from '~seeds';
import { addSecondsToUnixTime, calculateAccountRefund, signMessageForProRataDeposit } from '~utils';
import { customError } from './testData';
import {
  CalculateBaseSwappedAmountEventArgs,
  DepositEventArgs,
  ForceWithdrawEventArgs,
  RefundEventArgs,
  UpdateAccountItemEventArgs,
  WithdrawBaseGoalEventArgs,
  WithdrawExcessTokensEventArgs,
  WithdrawSwappedAmountEventArgs,
} from './types';
import {
  checkTotalSQRBalance,
  contractZeroCheck,
  depositSig,
  findEvent,
  getBaseContactConfig,
  getBaseTokenBalance,
  loadSQRpProRataFixture,
  transferToUserAndApproveForContract,
} from './utils';

export function shouldBehaveCorrectFundingDefaultCase(): void {
  describe('funding: default case', () => {
    beforeEach(async function () {
      await loadSQRpProRataFixture(this, {
        contractConfig: {
          ...getBaseContactConfig(contractConfig),
        },
      });
      await checkTotalSQRBalance(this);
    });

    afterEach(async function () {
      await checkTotalSQRBalance(this);
    });

    it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
      await contractZeroCheck(this);
    });

    it('user1 tries to call withdrawBaseGoal without permission', async function () {
      await expect(this.user1SQRpProRata.withdrawBaseGoal()).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.ownableUnauthorizedAccount,
      );
    });

    it('user1 tries to call withdrawBaseSwappedAmount without permission', async function () {
      await expect(this.user1SQRpProRata.withdrawBaseSwappedAmount()).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.ownableUnauthorizedAccount,
      );
    });

    it('owner2 tries to call withdrawBaseSwappedAmount too early', async function () {
      await expect(this.owner2SQRpProRata.withdrawBaseSwappedAmount()).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.tooEarly,
      );
    });

    it('user1 tries to call withdrawExcessTokens without permission', async function () {
      await expect(this.user1SQRpProRata.withdrawExcessTokens()).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.ownableUnauthorizedAccount,
      );
    });

    it('user1 tries to call withdrawExcessTokens too early', async function () {
      await expect(this.owner2SQRpProRata.withdrawExcessTokens()).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.tooEarly,
      );
    });

    it('user1 tries to call calculateBaseSwappedAmount without permission', async function () {
      await expect(
        this.user1SQRpProRata.calculateBaseSwappedAmount(seedData.batchSize),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.ownableUnauthorizedAccount);
    });

    it('owner2 tries to call calculateBaseSwappedAmount too early', async function () {
      await expect(
        this.owner2SQRpProRata.calculateBaseSwappedAmount(seedData.batchSize),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.tooEarly);
    });

    it('owner tries to call withdrawBaseGoal to early', async function () {
      await expect(this.owner2SQRpProRata.withdrawBaseGoal()).revertedWithCustomError(
        this.owner2SQRpProRata,
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
        this.user1SQRpProRata.depositSig({
          baseAmount: seedData.deposit1,
          boost: false,
          boostExchangeRate: seedData.zero,
          transactionId: seedData.transactionId1,
          timestampLimit: seedData.startDatePlus1m,
          signature,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.tooEarly);
    });

    it('user1 tries to call depositSig too late', async function () {
      await time.increaseTo(addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift));

      expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);

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
        this.user1SQRpProRata.depositSig({
          baseAmount: seedData.deposit1,
          boost: false,
          boostExchangeRate: seedData.zero,
          transactionId: seedData.transactionId1,
          timestampLimit: seedData.closeDatePlus1m,
          signature,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.tooLate);
    });

    it('user1 tries to call updateAccountItem without permission', async function () {
      await expect(
        this.user1SQRpProRata.updateAccountItem(this.user1Address, {
          manual: seedData.manual,
          baseAllocation: seedData.baseAllocation1,
          baseRefund: seedData.baseRefund1,
          boostRefund: seedData.boostRefund1,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.ownableUnauthorizedAccount);
    });

    it('user1 tries to call updateAccountItems without permission', async function () {
      await expect(
        this.user1SQRpProRata.updateAccountItems(
          [this.user1Address],
          [
            {
              manual: seedData.manual,
              baseAllocation: seedData.baseAllocation1,
              baseRefund: seedData.baseRefund1,
              boostRefund: seedData.boostRefund1,
            },
          ],
        ),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.ownableUnauthorizedAccount);
    });

    it('owner2 tries to call updateAccountItem without account item existence ', async function () {
      await expect(
        this.owner2SQRpProRata.updateAccountItem(this.user1Address, {
          manual: seedData.manual,
          baseAllocation: seedData.baseAllocation1,
          baseRefund: seedData.baseRefund1,
          boostRefund: seedData.boostRefund1,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.nonExistAccountItem);
    });

    it('owner2 tries to call updateAccountItems without account item existence', async function () {
      await expect(
        this.owner2SQRpProRata.updateAccountItems(
          [this.user1Address],
          [
            {
              manual: seedData.manual,
              baseAllocation: seedData.baseAllocation1,
              baseRefund: seedData.baseRefund1,
              boostRefund: seedData.boostRefund1,
            },
          ],
        ),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.nonExistAccountItem);
    });

    it('owner2 tries to call updateAccountItems without correct array length', async function () {
      await expect(
        this.owner2SQRpProRata.updateAccountItems([this.user1Address], []),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.arrayLengthsNotEqual);
    });

    describe('set time after start date', () => {
      beforeEach(async function () {
        await time.increaseTo(addSecondsToUnixTime(contractConfig.startDate, seedData.timeShift));
      });

      it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
        expect(await this.user1SQRpProRata.getAccountDepositNonce(this.user1Address)).eq(0);
        expect(await this.user2SQRpProRata.getAccountDepositNonce(this.user2Address)).eq(0);
        expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(contractConfig.baseGoal);
      });

      it('user1 tries to call forceWithdraw without permission', async function () {
        const contractAmount = await this.user1SQRpProRata.getBaseBalance();

        await expect(
          this.user1SQRpProRata.forceWithdraw(
            this.baseTokenAddress,
            this.user3Address,
            contractAmount,
          ),
        )
          .revertedWithCustomError(this.user1SQRpProRata, customError.ownableUnauthorizedAccount)
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
          this.user1SQRpProRata.depositSig({
            baseAmount: seedData.zero,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId1,
            timestampLimit: seedData.startDatePlus1m,
            signature,
          }),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.baseAmountNotZero);
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
          this.user1SQRpProRata.depositSig({
            baseAmount: seedData.deposit1,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId1,
            timestampLimit: seedData.startDatePlus1m,
            signature,
          }),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.userMustAllowToUseFunds);
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
          this.user1SQRpProRata.depositSig({
            baseAmount: seedData.deposit1,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId1,
            timestampLimit: seedData.startDatePlus1m,
            signature,
          }),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.timeoutBlocker);
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
          this.user1SQRpProRata.depositSig({
            baseAmount: seedData.deposit1,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId1,
            timestampLimit: seedData.startDatePlus1m,
            signature: wrongSignature,
          }),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.invalidSignature);
      });

      it('user1 tries to call depositSig with allowance but no funds', async function () {
        await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

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
          this.user1SQRpProRata.depositSig({
            baseAmount: seedData.deposit1,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId1,
            timestampLimit: seedData.startDatePlus1m,
            signature,
          }),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.userMustHaveFunds);
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
          this.user2SQRpProRata.depositSig({
            baseAmount: seedData.deposit2,
            boost: false,
            boostExchangeRate: seedData.zero,
            transactionId: seedData.transactionId2,
            timestampLimit: seedData.startDatePlus1m,
            signature,
          }),
        ).revertedWithCustomError(this.owner2SQRpProRata, customError.userMustAllowToUseFunds);
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
          await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

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
            this.user1SQRpProRata.depositSig({
              baseAmount: seedData.deposit1,
              boost: false,
              boostExchangeRate: seedData.zero,
              transactionId: seedData.transactionId1,
              timestampLimit: seedData.startDatePlus1m,
              signature,
            });

          await expect(Promise.all([depositSig(), depositSig()])).revertedWithCustomError(
            this.owner2SQRpProRata,
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
            this.user1SQRpProRata.depositSig({
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
              userSQRpProRata: this.user1SQRpProRata,
              userAddress: this.user1Address,
              baseDeposit: seedData.deposit1,
              transactionId: seedData.transactionId1,
              timestampLimit: seedData.startDatePlus1m,
            });
          });

          it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
            expect(await this.owner2SQRpProRata.getAccountCount()).eq(1);
            expect(await getBaseTokenBalance(this, this.user1Address)).eq(
              seedData.userInitBalance - seedData.deposit1,
            );
            expect(await this.owner2SQRpProRata.balanceOf(this.user1Address)).eql([
              seedData.deposit1,
              seedData.zero,
            ]);
            expect(await this.owner2SQRpProRata.calculateOverfundAmount()).eq(seedData.zero);

            expect(await this.owner2SQRpProRata.getAccountBaseRefund(this.user1Address)).eq(
              seedData.deposit1,
            );

            const {
              manual,
              baseDeposited,
              baseDeposit,
              baseAllocation,
              baseRefunded,
              baseRefund,
              nonce,
              boosted,
            } = await this.user1SQRpProRata.fetchAccountInfo(this.user1Address);
            expect(manual).eq(false);
            expect(baseDeposited).eq(seedData.deposit1);
            expect(baseDeposit).eq(seedData.deposit1);
            expect(baseAllocation).eq(seedData.zero);
            expect(baseRefunded).eq(seedData.zero);
            expect(baseRefund).eq(seedData.deposit1);
            expect(nonce).eq(1);
            expect(boosted).eq(false);

            expect(await this.owner2SQRpProRata.totalBaseDeposited()).eq(seedData.deposit1);

            const transactionItem = await this.user1SQRpProRata.fetchTransactionItem(
              seedData.transactionId1,
            );
            expect(transactionItem.amount).eq(seedData.deposit1);

            expect(await this.user1SQRpProRata.getAccountDepositNonce(this.user1Address)).eq(1);
            expect(await this.user2SQRpProRata.getAccountDepositNonce(this.user2Address)).eq(0);

            expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(
              contractConfig.baseGoal - seedData.deposit1,
            );

            expect(await this.ownerSQRpProRata.getDepositRefundAllocation(this.user1Address)).eq(
              seedData.zero,
            );
            const {
              baseDeposited: baseDeposited1,
              boosted: boosted1,
              baseAllocation: baseAllocation1,
              baseRefund: baseRefund1,
              boostRefund: boostRefund1,
              nonce: nonce1,
            } = await this.ownerSQRpProRata.getDepositRefundAccountInfo(this.user1Address);
            expect(baseDeposited1).eq(seedData.deposit1);
            expect(boosted1).eq(false);
            expect(baseAllocation1).eq(seedData.zero);
            expect(baseRefund1).eq(seedData.deposit1);
            expect(boostRefund1).eq(seedData.zero);
            expect(nonce1).eq(1);

            expect(await this.ownerSQRpProRata.getDepositRefundAllocation(this.user2Address)).eq(
              seedData.zero,
            );
            const {
              baseDeposited: baseDeposited2,
              boosted: boosted2,
              baseAllocation: baseAllocation2,
              baseRefund: baseRefund2,
              boostRefund: boostRefund2,
              nonce: nonce2,
            } = await this.ownerSQRpProRata.getDepositRefundAccountInfo(this.user2Address);
            expect(baseDeposited2).eq(seedData.zero);
            expect(boosted2).eq(false);
            expect(baseAllocation2).eq(seedData.zero);
            expect(baseRefund2).eq(seedData.zero);
            expect(boostRefund2).eq(seedData.zero);
            expect(nonce2).eq(0);

            const { totalBaseDeposited } =
              await this.ownerSQRpProRata.getDepositRefundContractInfo();
            expect(totalBaseDeposited).eq(await this.ownerSQRpProRata.totalBaseDeposited());
            expect(await this.owner2SQRpProRata.calculateAccidentAmount()).eq(seedData.zero);
            expect(await this.ownerSQRpProRata.isReachedBaseGoal()).eq(false);
          });

          it('user1 deposited base tokens again', async function () {
            await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.deposit1);

            await depositSig({
              context: this,
              userSQRpProRata: this.user1SQRpProRata,
              userAddress: this.user1Address,
              baseDeposit: seedData.deposit1,
              transactionId: seedData.transactionId1_2,
              timestampLimit: seedData.startDatePlus1m,
            });

            const user1Deposit = BigInt(2) * seedData.deposit1;

            expect(await this.owner2SQRpProRata.getAccountCount()).eq(1);
            expect(await this.owner2SQRpProRata.totalBaseDeposited()).eq(user1Deposit);

            const refund1 = calculateAccountRefund(
              contractConfig.baseGoal,
              user1Deposit,
              user1Deposit,
            );

            expect(await this.ownerSQRpProRata.getDepositRefundAllocation(this.user1Address)).eq(
              user1Deposit - refund1,
            );
            const {
              baseDeposited: baseDeposited1,
              boosted: boosted1,
              baseAllocation: baseAllocation1,
              baseRefund: baseRefund1,
              boostRefund: boostRefund1,
              nonce: nonce1,
            } = await this.ownerSQRpProRata.getDepositRefundAccountInfo(this.user1Address);
            expect(baseDeposited1).eq(user1Deposit);
            expect(boosted1).eq(false);
            expect(baseAllocation1).eq(user1Deposit - refund1);
            expect(baseRefund1).eq(refund1);
            expect(boostRefund1).eq(seedData.zero);
            expect(nonce1).eq(2);

            expect(await this.ownerSQRpProRata.getDepositRefundAllocation(this.user2Address)).eq(
              seedData.zero,
            );
            const {
              baseDeposited: baseDeposited2,
              boosted: boosted2,
              baseAllocation: baseAllocation2,
              baseRefund: baseRefund2,
              boostRefund: boostRefund2,
              nonce: nonce2,
            } = await this.ownerSQRpProRata.getDepositRefundAccountInfo(this.user2Address);
            expect(baseDeposited2).eq(seedData.zero);
            expect(boosted2).eq(false);
            expect(baseAllocation2).eq(seedData.zero);
            expect(baseRefund2).eq(seedData.zero);
            expect(boostRefund2).eq(seedData.zero);
            expect(nonce2).eq(0);

            const { totalBaseDeposited } =
              await this.ownerSQRpProRata.getDepositRefundContractInfo();
            expect(totalBaseDeposited).eq(await this.ownerSQRpProRata.totalBaseDeposited());
            expect(await this.ownerSQRpProRata.isReachedBaseGoal()).eq(true);
          });

          it('owner2 called forceWithdraw (check event)', async function () {
            expect(await getBaseTokenBalance(this, this.user3Address)).eq(seedData.zero);

            const contractAmount = await this.owner2SQRpProRata.getBaseBalance();

            const receipt = await waitTx(
              this.owner2SQRpProRata.forceWithdraw(
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

            expect(await this.owner2SQRpProRata.balanceOf(this.user1Address)).eql([
              seedData.deposit1,
              seedData.zero,
            ]);
            expect(await this.owner2SQRpProRata.balanceOf(this.user2Address)).eql([
              seedData.zero,
              seedData.zero,
            ]);

            expect(await this.owner2SQRpProRata.totalBaseDeposited()).eq(seedData.deposit1);
          });

          it('owner2 called updateAccountItem (check event)', async function () {
            const initialAccountCount = await this.owner2SQRpProRata.getAccountCount();
            const initialUpdateTimestamp = await time.latest();
            expect(await this.owner2SQRpProRata.getAccountItemUpdateLogs()).eql([]);

            const receipt = await waitTx(
              this.owner2SQRpProRata.updateAccountItem(this.user1Address, {
                manual: seedData.manual,
                baseAllocation: seedData.baseAllocation1,
                baseRefund: seedData.baseRefund1,
                boostRefund: seedData.boostRefund1,
              }),
            );
            const eventLog = findEvent<UpdateAccountItemEventArgs>(receipt);

            expect(eventLog).not.undefined;
            const [account, manual, baseAllocation, baseRefund, boostRefund] = eventLog?.args;
            expect(account).eq(this.user1Address);
            expect(manual).eq(seedData.manual);
            expect(baseAllocation).eq(seedData.baseAllocation1);
            expect(baseRefund).eq(seedData.baseRefund1);
            expect(boostRefund).eq(seedData.boostRefund1);

            const accountInfo1 = await this.user1SQRpProRata.fetchAccountInfo(this.user1Address);
            expect(accountInfo1.baseDeposited).eq(seedData.deposit1);
            expect(accountInfo1.baseDeposit).eq(seedData.deposit1);
            expect(accountInfo1.manual).eq(seedData.manual);
            expect(accountInfo1.baseAllocation).eq(seedData.baseAllocation1);
            expect(accountInfo1.baseRefund).eq(seedData.baseRefund1);
            expect(accountInfo1.baseRefunded).eq(seedData.zero);
            expect(accountInfo1.boostRefund).eq(seedData.boostRefund1);
            expect(accountInfo1.boostRefunded).eq(seedData.zero);
            expect(accountInfo1.nonce).eq(1);

            expect(await this.owner2SQRpProRata.getAccountCount()).eq(initialAccountCount);

            const updateLogs = await this.owner2SQRpProRata.getAccountItemUpdateLogs();
            expect(updateLogs).not.undefined;
            expect(updateLogs.length).eq(1);

            const firstLog = updateLogs[0];

            expect(firstLog.account).eq(this.owner2Address);
            expect(firstLog.timestamp).closeTo(initialUpdateTimestamp, seedData.timeShift);
            expect(firstLog.updatedCount).eq(1);
          });

          describe(`set time after close date when goal wasn't reached`, () => {
            beforeEach(async function () {
              await time.increaseTo(
                addSecondsToUnixTime(contractConfig.closeDate, seedData.timeShift),
              );
            });

            it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
              expect(await this.owner2SQRpProRata.getAccountBaseRefund(this.user1Address)).eq(
                seedData.deposit1,
              );
              expect(await this.owner2SQRpProRata.getAccountBaseRefund(this.user2Address)).eq(
                seedData.zero,
              );

              expect(await this.owner2SQRpProRata.isDepositReady()).eq(false);

              expect(await this.ownerSQRpProRata.getDepositRefundFetchReady()).eq(true);
            });

            it('owner2 tries to call withdrawExcessTokens without refunding', async function () {
              await expect(this.owner2SQRpProRata.withdrawExcessTokens()).revertedWithCustomError(
                this.owner2SQRpProRata,
                customError.notRefunded,
              );
            });

            it('owner2 tries to withdraw unreached goal when someone accidentally sent tokens', async function () {
              expect(await this.owner2SQRpProRata.calculateAccidentAmount()).eq(seedData.zero);

              await this.owner2BaseToken.transfer(this.sqrpProRataAddress, seedData.accidentAmount);

              expect(await this.owner2SQRpProRata.calculateAccidentAmount()).eq(
                seedData.accidentAmount,
              );

              await expect(this.owner2SQRpProRata.withdrawBaseGoal()).revertedWithCustomError(
                this.owner2SQRpProRata,
                customError.unreachedGoal,
              );
            });

            it('owner2 tries to withdraw unreached goal', async function () {
              await expect(this.owner2SQRpProRata.withdrawBaseGoal()).revertedWithCustomError(
                this.owner2SQRpProRata,
                customError.unreachedGoal,
              );
            });
          });

          it('user1 tries to call depositSig with the same transactionId', async function () {
            await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.extraDeposit1);

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
              this.user1SQRpProRata.depositSig({
                baseAmount: seedData.deposit1,
                boost: false,
                boostExchangeRate: seedData.zero,
                transactionId: seedData.transactionId1,
                timestampLimit: seedData.startDatePlus1m,
                signature,
              }),
            ).revertedWithCustomError(this.owner2SQRpProRata, customError.usedTransactionId);
          });

          describe('user2 deposited base tokens', () => {
            beforeEach(async function () {
              await depositSig({
                context: this,
                userSQRpProRata: this.user2SQRpProRata,
                userAddress: this.user2Address,
                baseDeposit: seedData.deposit2,
                transactionId: seedData.transactionId2,
                timestampLimit: seedData.startDatePlus1m,
              });
            });

            it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
              expect(await this.owner2SQRpProRata.getAccountCount()).eq(2);
              expect(await getBaseTokenBalance(this, this.user2Address)).eq(
                seedData.userInitBalance - seedData.deposit2,
              );
              expect(await this.owner2SQRpProRata.balanceOf(this.user2Address)).eql([
                seedData.deposit2,
                seedData.zero,
              ]);
              expect(await this.owner2SQRpProRata.calculateOverfundAmount()).eq(
                seedData.deposit1 + seedData.deposit2 - contractConfig.baseGoal,
              );

              const refund1 = calculateAccountRefund(
                contractConfig.baseGoal,
                seedData.deposit1,
                seedData.deposit12,
              );

              expect(await this.owner2SQRpProRata.getAccountBaseRefund(this.user1Address)).eq(
                refund1,
              );

              const refund2 = calculateAccountRefund(
                contractConfig.baseGoal,
                seedData.deposit2,
                seedData.deposit12,
              );

              expect(await this.owner2SQRpProRata.getAccountBaseRefund(this.user2Address)).eq(
                refund2,
              );

              const {
                manual,
                baseDeposited,
                baseDeposit,
                baseAllocation,
                baseRefunded,
                baseRefund,
                nonce,
                boosted,
              } = await this.user1SQRpProRata.fetchAccountInfo(this.user1Address);
              expect(manual).eq(false);
              expect(baseDeposited).eq(seedData.deposit1);
              expect(baseDeposit).eq(seedData.deposit1);
              expect(baseAllocation).eq(seedData.deposit1 - refund1);
              expect(baseRefunded).eq(seedData.zero);
              expect(baseRefund).eq(refund1);
              expect(nonce).eq(1);
              expect(boosted).eq(false);

              expect(await this.owner2SQRpProRata.totalBaseDeposited()).eq(seedData.deposit12);

              const transactionItem = await this.user1SQRpProRata.fetchTransactionItem(
                seedData.transactionId1,
              );
              expect(transactionItem.amount).eq(seedData.deposit1);

              expect(await this.user1SQRpProRata.getAccountDepositNonce(this.user1Address)).eq(1);
              expect(await this.user2SQRpProRata.getAccountDepositNonce(this.user2Address)).eq(1);

              expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);

              expect(await this.ownerSQRpProRata.getDepositRefundAllocation(this.user1Address)).eq(
                seedData.deposit1 - refund1,
              );
              const {
                baseDeposited: baseDeposited1,
                boosted: boosted1,
                baseAllocation: baseAllocation1,
                baseRefund: baseRefund1,
                boostRefund: boostRefund1,
                nonce: nonce1,
              } = await this.ownerSQRpProRata.getDepositRefundAccountInfo(this.user1Address);
              expect(baseDeposited1).eq(seedData.deposit1);
              expect(boosted1).eq(false);
              expect(baseAllocation1).eq(seedData.deposit1 - refund1);
              expect(baseRefund1).eq(refund1);
              expect(boostRefund1).eq(seedData.zero);
              expect(nonce1).eq(1);

              expect(await this.ownerSQRpProRata.getDepositRefundAllocation(this.user2Address)).eq(
                seedData.deposit2 - refund2,
              );
              expect(await this.ownerSQRpProRata.getDepositRefundAllocation(this.user2Address)).eq(
                seedData.deposit2 - refund2,
              );
              const {
                baseDeposited: baseDeposited2,
                boosted: boosted2,
                baseAllocation: baseAllocation2,
                baseRefund: baseRefund2,
                boostRefund: boostRefund2,
                nonce: nonce2,
              } = await this.ownerSQRpProRata.getDepositRefundAccountInfo(this.user2Address);
              expect(baseDeposited2).eq(seedData.deposit2);
              expect(boosted2).eq(false);
              expect(baseAllocation2).eq(seedData.deposit2 - refund2);
              expect(baseRefund2).eq(refund2);
              expect(boostRefund2).eq(seedData.zero);
              expect(nonce2).eq(1);

              const { totalBaseDeposited } =
                await this.ownerSQRpProRata.getDepositRefundContractInfo();
              expect(totalBaseDeposited).eq(await this.ownerSQRpProRata.totalBaseDeposited());
              expect(await this.owner2SQRpProRata.calculateAccidentAmount()).eq(seedData.zero);
              expect(await this.ownerSQRpProRata.isReachedBaseGoal()).eq(true);
            });

            it('owner2 tries to refund tokens for first user too early', async function () {
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
                  await this.owner2SQRpProRata.getAccountBaseRefund(this.user1Address),
                ).closeTo(
                  calculateAccountRefund(
                    contractConfig.baseGoal,
                    seedData.deposit1,
                    seedData.deposit12,
                  ),
                  seedData.baseBalanceDelta,
                );
                expect(
                  await this.owner2SQRpProRata.getAccountBaseRefund(this.user2Address),
                ).closeTo(
                  calculateAccountRefund(
                    contractConfig.baseGoal,
                    seedData.deposit2,
                    seedData.deposit12,
                  ),
                  seedData.baseBalanceDelta,
                );

                expect(await this.owner2SQRpProRata.calculateRemainDeposit()).eq(seedData.zero);

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

                const user1 = await this.user1SQRpProRata.fetchAccountInfo(this.user1Address);
                expect(user1.baseDeposited).eq(seedData.deposit1);
                expect(user1.baseDeposit).eq(seedData.deposit1);
                expect(user1.baseAllocation).eq(seedData.deposit1 - refund1);
                expect(user1.baseRefund).eq(refund1);
                expect(user1.baseRefunded).eq(seedData.zero);
                expect(user1.nonce).eq(1);
                expect(user1.boosted).eq(false);

                const user2 = await this.user2SQRpProRata.fetchAccountInfo(this.user2Address);
                expect(user2.baseDeposited).eq(seedData.deposit2);
                expect(user2.baseDeposit).eq(seedData.deposit2);
                expect(user2.baseAllocation).eq(seedData.deposit2 - refund2);
                expect(user2.baseRefund).eq(refund2);
                expect(user2.baseRefunded).eq(seedData.zero);
                expect(user2.nonce).eq(1);
                expect(user2.boosted).eq(false);

                expect(await this.ownerSQRpProRata.calculateTotalRefundTokensAll()).eql([
                  refund1 + refund2,
                  seedData.zero,
                ]);
              });

              it('owner2 is allowed to call calculateBaseSwappedAmountAll (check event)', async function () {
                const receipt = await waitTx(
                  this.owner2SQRpProRata.calculateBaseSwappedAmountAll(),
                );
                const eventLog = findEvent<CalculateBaseSwappedAmountEventArgs>(receipt);

                expect(eventLog).not.undefined;
                const [batchSize, endIndex] = eventLog?.args;
                const accountCount = await this.owner2SQRpProRata.getAccountCount();
                expect(batchSize).eq(accountCount);
                expect(endIndex).eq(accountCount);

                expect(await this.owner2SQRpProRata.getProcessedBaseSwappedIndex()).eq(
                  accountCount,
                );
              });

              describe('owner2 called calculateBaseSwappedAmountAll', () => {
                beforeEach(async function () {
                  await this.owner2SQRpProRata.calculateBaseSwappedAmountAll();
                });

                it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                  const accountCount = await this.owner2SQRpProRata.getAccountCount();
                  expect(await this.owner2SQRpProRata.getProcessedBaseSwappedIndex()).eq(
                    accountCount,
                  );
                });

                it('owner2 tries to call allUsersProcessedBaseSwapped which was processed', async function () {
                  await expect(
                    this.owner2SQRpProRata.calculateBaseSwappedAmount(seedData.batchSize),
                  ).revertedWithCustomError(
                    this.owner2SQRpProRata,
                    customError.allUsersProcessedBaseSwapped,
                  );
                });

                it('owner2 is allowed to call withdrawBaseSwappedAmount (check event)', async function () {
                  const receipt = await waitTx(this.owner2SQRpProRata.withdrawBaseSwappedAmount());
                  const eventLog = findEvent<WithdrawSwappedAmountEventArgs>(receipt);

                  expect(eventLog).not.undefined;
                  const [account, baseAmount] = eventLog?.args;
                  expect(account).eq(this.owner2Address);
                  expect(baseAmount).eq(seedData.zero);
                });

                it('owner2 tries to call withdrawBaseSwappedAmount twice', async function () {
                  await this.owner2SQRpProRata.withdrawBaseSwappedAmount();

                  await expect(
                    this.owner2SQRpProRata.withdrawBaseSwappedAmount(),
                  ).revertedWithCustomError(
                    this.owner2SQRpProRata,
                    customError.withdrewBaseSwappedAmount,
                  );
                });
              });

              it('owner is allowed to withdraw goal (check event)', async function () {
                const receipt = await waitTx(this.owner2SQRpProRata.withdrawBaseGoal());
                const eventLog = findEvent<WithdrawBaseGoalEventArgs>(receipt);

                expect(eventLog).not.undefined;
                const [account, amount] = eventLog?.args;
                expect(account).eq(this.owner2Address);
                expect(amount).eq(contractConfig.baseGoal);
              });

              it('owner2 refunded tokens for first user (check event)', async function () {
                const receipt = await waitTx(this.owner2SQRpProRata.refund(seedData.batchSize));

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

                expect(await this.owner2SQRpProRata.getProcessedRefundIndex()).eq(1);
              });

              it('user1 tries to refund tokens for first user', async function () {
                await expect(
                  this.user1SQRpProRata.refund(seedData.batchSize),
                ).revertedWithCustomError(
                  this.owner2SQRpProRata,
                  customError.ownableUnauthorizedAccount,
                );
              });

              it('check calculateAccidentAmount', async function () {
                expect(await this.owner2SQRpProRata.calculateAccidentAmount()).eq(seedData.zero);
                await this.owner2BaseToken.transfer(
                  this.sqrpProRataAddress,
                  seedData.accidentAmount,
                );
                expect(await this.owner2SQRpProRata.calculateAccidentAmount()).eq(
                  seedData.accidentAmount,
                );
                await this.owner2SQRpProRata.refundAll();

                expect(await this.owner2SQRpProRata.calculateAccidentAmount()).eq(
                  seedData.accidentAmount,
                );

                await this.owner2SQRpProRata.withdrawBaseGoal();

                expect(await this.owner2SQRpProRata.calculateAccidentAmount()).eq(
                  seedData.accidentAmount,
                );
              });

              describe('owner2 refunded tokens for all user', () => {
                beforeEach(async function () {
                  await this.owner2SQRpProRata.refundAll();
                });

                it(INITIAL_POSITIVE_CHECK_TEST_TITLE, async function () {
                  expect(await this.owner2SQRpProRata.getProcessedRefundIndex()).eq(2);

                  expect(await getBaseTokenBalance(this, this.sqrpProRataAddress)).closeTo(
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
                    await this.ownerSQRpProRata.getDepositRefundAllocation(this.user1Address),
                  ).eq(seedData.deposit1 - refund1);
                  const {
                    baseDeposited: baseDeposited1,
                    boosted: boosted1,
                    baseAllocation: baseAllocation1,
                    baseRefund: baseRefund1,
                    boostRefund: boostRefund1,
                    nonce: nonce1,
                  } = await this.ownerSQRpProRata.getDepositRefundAccountInfo(this.user1Address);
                  expect(baseDeposited1).eq(seedData.deposit1);
                  expect(boosted1).eq(false);
                  expect(baseAllocation1).eq(seedData.deposit1 - refund1);
                  expect(baseRefund1).eq(refund1);
                  expect(boostRefund1).eq(seedData.zero);
                  expect(nonce1).eq(1);

                  expect(
                    await this.ownerSQRpProRata.getDepositRefundAllocation(this.user2Address),
                  ).eq(seedData.deposit2 - refund2);
                  const {
                    baseDeposited: baseDeposited2,
                    boosted: boosted2,
                    baseAllocation: baseAllocation2,
                    baseRefund: baseRefund2,
                    boostRefund: boostRefund2,
                    nonce: nonce2,
                  } = await this.ownerSQRpProRata.getDepositRefundAccountInfo(this.user2Address);
                  expect(baseDeposited2).eq(seedData.deposit2);
                  expect(boosted2).eq(false);
                  expect(baseAllocation2).eq(seedData.deposit2 - refund2);
                  expect(baseRefund2).eq(refund2);
                  expect(boostRefund2).eq(seedData.zero);
                  expect(nonce2).eq(1);

                  const { totalBaseDeposited } =
                    await this.ownerSQRpProRata.getDepositRefundContractInfo();
                  expect(totalBaseDeposited).eq(await this.ownerSQRpProRata.totalBaseDeposited());

                  expect(await this.owner2SQRpProRata.calculateAccidentAmount()).eq(seedData.zero);

                  expect(await this.owner2SQRpProRata.totalBaseRefunded()).eq(refund1 + refund2);

                  const user1 = await this.user1SQRpProRata.fetchAccountInfo(this.user1Address);
                  expect(user1.baseDeposit).eq(seedData.deposit1);
                  expect(user1.baseAllocation).eq(seedData.deposit1 - refund1);
                  expect(user1.baseRefund).eq(refund1);
                  expect(user1.nonce).eq(1);
                  expect(user1.boosted).eq(false);

                  const user2 = await this.user2SQRpProRata.fetchAccountInfo(this.user2Address);
                  expect(user2.baseDeposit).eq(seedData.deposit2);
                  expect(user2.baseAllocation).eq(seedData.deposit2 - refund2);
                  expect(user2.baseRefund).eq(refund2);
                  expect(user2.nonce).eq(1);
                  expect(user2.boosted).eq(false);
                });

                it('owner2 tries to call withdrawBaseGoal again', async function () {
                  await expect(this.owner2SQRpProRata.refundAll()).revertedWithCustomError(
                    this.owner2SQRpProRata,
                    customError.allUsersProcessedRefund,
                  );
                });

                it('owner2 tries to call withdrawExcessTokens without withdrawing base goal', async function () {
                  await expect(
                    this.owner2SQRpProRata.withdrawExcessTokens(),
                  ).revertedWithCustomError(
                    this.owner2SQRpProRata,
                    customError.notWithdrawBaseGoal,
                  );
                });

                it('owner is allowed to withdraw goal (check event)', async function () {
                  const receipt = await waitTx(this.owner2SQRpProRata.withdrawBaseGoal());
                  const eventLog = findEvent<WithdrawBaseGoalEventArgs>(receipt);

                  expect(eventLog).not.undefined;
                  const [account, amount] = eventLog?.args;
                  expect(account).eq(this.owner2Address);
                  expect(amount).eq(contractConfig.baseGoal);
                });

                describe('owner2 withdrew goal', () => {
                  beforeEach(async function () {
                    await this.owner2SQRpProRata.withdrawBaseGoal();
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
                      await this.ownerSQRpProRata.getDepositRefundAllocation(this.user1Address),
                    ).eq(seedData.deposit1 - refund1);
                    const {
                      baseDeposited: baseDeposited1,
                      boosted: boosted1,
                      baseAllocation: baseAllocation1,
                      baseRefund: baseRefund1,
                      boostRefund: boostRefund1,
                      nonce: nonce1,
                    } = await this.ownerSQRpProRata.getDepositRefundAccountInfo(this.user1Address);
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
                      await this.ownerSQRpProRata.getDepositRefundAllocation(this.user2Address),
                    ).eq(seedData.deposit2 - refund2);
                    const {
                      baseDeposited: baseDeposited2,
                      boosted: boosted2,
                      baseAllocation: baseAllocation2,
                      baseRefund: baseRefund2,
                      boostRefund: boostRefund2,
                      nonce: nonce2,
                    } = await this.ownerSQRpProRata.getDepositRefundAccountInfo(this.user2Address);
                    expect(baseDeposited2).eq(seedData.deposit2);
                    expect(boosted2).eq(false);
                    expect(baseAllocation2).eq(seedData.deposit2 - refund2);
                    expect(baseRefund2).eq(refund2);
                    expect(boostRefund2).eq(seedData.zero);
                    expect(nonce2).eq(1);

                    const { totalBaseDeposited } =
                      await this.ownerSQRpProRata.getDepositRefundContractInfo();
                    expect(totalBaseDeposited).eq(await this.ownerSQRpProRata.totalBaseDeposited());
                    expect(await this.ownerSQRpProRata.totalBaseWithdrew()).eq(
                      contractConfig.baseGoal,
                    );
                  });

                  it('owner2 tries to withdrew goal again', async function () {
                    await expect(this.owner2SQRpProRata.withdrawBaseGoal()).revertedWithCustomError(
                      this.owner2SQRpProRata,
                      customError.alreadyWithdrewBaseGoal,
                    );
                  });

                  it('owner is allowed to withdraw goal (check event)', async function () {
                    await this.owner2BaseToken.transfer(
                      this.sqrpProRataAddress,
                      seedData.extraDeposit1,
                    );
                    await this.owner2BoostToken.transfer(
                      this.sqrpProRataAddress,
                      seedData.extraDeposit2,
                    );

                    const baseBalance = await this.owner2SQRpProRata.getBaseBalance();
                    const boostBalance = await this.owner2SQRpProRata.getBoostBalance();

                    const receipt = await waitTx(this.owner2SQRpProRata.withdrawExcessTokens());
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
