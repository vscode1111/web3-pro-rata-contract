import { expect } from 'chai';
import { Dayjs } from 'dayjs';
import { ZeroAddress } from 'ethers';
import { waitTx } from '~common-contract';
import { ZERO } from '~constants';
import { contractConfig, seedData } from '~seeds';
import {
  addSecondsToUnixTime,
  getSQRpProRataContext,
  getUsers,
  signMessageForDeposit,
} from '~utils';
import { ChangeBalanceLimitArgs, customError } from '.';
import { findEvent, loadSQRpProRataFixture } from './utils';

export function shouldBehaveCorrectDeployment(): void {
  describe('deployment', () => {
    let chainTime: Dayjs;

    beforeEach(async function () {
      await loadSQRpProRataFixture(this, undefined, async (_chainTime, config) => {
        chainTime = _chainTime;
        return config;
      });
    });

    it('user1 tries to change balanceLimit', async function () {
      await expect(this.user1SQRpProRata.changeBalanceLimit(seedData.balanceLimit))
        .revertedWithCustomError(this.user1SQRpProRata, customError.ownableUnauthorizedAccount)
        .withArgs(this.user1Address);
    });

    it('owner2 changes balanceLimit', async function () {
      await this.owner2SQRpProRata.changeBalanceLimit(seedData.balanceLimit);

      const receipt = await waitTx(
        this.owner2SQRpProRata.changeBalanceLimit(seedData.balanceLimit),
      );
      const eventLog = findEvent<ChangeBalanceLimitArgs>(receipt);
      expect(eventLog).not.undefined;
      const [account, amount] = eventLog?.args;
      expect(account).eq(this.owner2Address);
      expect(amount).eq(seedData.balanceLimit);

      expect(await this.owner2SQRpProRata.balanceLimit()).eq(seedData.balanceLimit);
    });

    it('owner tries to deploy with zero new owner address', async function () {
      const users = await getUsers();
      await expect(
        getSQRpProRataContext(users, {
          ...contractConfig,
          newOwner: ZeroAddress,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.newOwnerNotZeroAddress);
    });

    it('owner tries to deploy with zero ERC20 token address', async function () {
      const users = await getUsers();
      await expect(
        getSQRpProRataContext(users, {
          ...contractConfig,
          erc20Token: ZeroAddress,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.erc20TokenNotZeroAddress);
    });

    it('owner tries to deploy when start date is later than close one', async function () {
      const users = await getUsers();
      await expect(
        getSQRpProRataContext(users, {
          ...contractConfig,
          startDate: addSecondsToUnixTime(chainTime, 10),
          closeDate: addSecondsToUnixTime(chainTime, 9),
        }),
      ).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.closeDateMustBeGreaterThanStartDate,
      );
    });

    it('owner deployed contract using specific deposit verifier', async function () {
      const users = await getUsers();
      const { user3Address } = users;

      await loadSQRpProRataFixture(this, {
        startDate: 0,
        verifier: user3Address,
      });

      await this.owner2ERC20Token.transfer(this.user1Address, seedData.userInitBalance);
      await this.user1ERC20Token.approve(this.sqrpProRataAddress, seedData.deposit1);

      const signature = await signMessageForDeposit(
        this.user3,
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
    });

    it('owner tries to deploy with invalid start date', async function () {
      const users = await getUsers();
      await expect(
        getSQRpProRataContext(users, {
          ...contractConfig,
          startDate: 1,
        }),
      ).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.startDateMustBeGreaterThanCurrentTime,
      );
    });

    it('owner tries to deploy with invalid close date', async function () {
      const users = await getUsers();
      await expect(
        getSQRpProRataContext(users, {
          ...contractConfig,
          closeDate: 0,
        }),
      ).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.closeDateMustBeGreaterThanCurrentTime,
      );
    });

    it('owner tries to deploy with zero verifier address', async function () {
      const users = await getUsers();
      await expect(
        getSQRpProRataContext(users, {
          ...contractConfig,
          verifier: ZeroAddress,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.verifierNotZeroAddress);
    });

    it('owner tries to deploy with zero cold wallet address', async function () {
      const users = await getUsers();
      await expect(
        getSQRpProRataContext(users, {
          ...contractConfig,
          coldWallet: ZeroAddress,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.coldWalletNotZeroAddress);
    });

    it('owner tries to deploy with zero deposit goal', async function () {
      const users = await getUsers();
      await expect(
        getSQRpProRataContext(users, {
          ...contractConfig,
          goal: ZERO,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.goalNotZero);
    });
  });
}
