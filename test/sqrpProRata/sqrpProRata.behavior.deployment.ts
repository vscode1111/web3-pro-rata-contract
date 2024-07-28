import { expect } from 'chai';
import { Dayjs } from 'dayjs';
import { ZeroAddress } from 'ethers';
import { ZERO } from '~constants';
import { contractConfig, seedData } from '~seeds';
import {
  addSecondsToUnixTime,
  getSQRpProRataContext,
  getUsers,
  signMessageForProRataDeposit,
} from '~utils';
import { customError } from '.';
import { loadSQRpProRataFixture } from './utils';

export function shouldBehaveCorrectDeployment(): void {
  describe('deployment', () => {
    let chainTime: Dayjs;

    beforeEach(async function () {
      await loadSQRpProRataFixture(this, undefined, async (_chainTime, config) => {
        chainTime = _chainTime;
        return config;
      });
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

    it('owner tries to deploy with zero base token address', async function () {
      await expect(
        getSQRpProRataContext(await getUsers(), {
          ...contractConfig,
          baseToken: ZeroAddress,
          boostToken: (await getUsers()).user1Address,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.baseTokenNotZeroAddress);
    });

    it('owner tries to deploy when start date is later than close one', async function () {
      await expect(
        getSQRpProRataContext(await getUsers(), {
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
      const { user3Address } = await getUsers();
      await loadSQRpProRataFixture(this, {
        contractConfig: {
          startDate: 0,
          depositVerifier: user3Address,
        },
      });

      await this.owner2BaseToken.transfer(this.user1Address, seedData.userInitBalance);
      await this.user1BaseToken.approve(this.sqrpProRataAddress, seedData.deposit1);

      const signature = await signMessageForProRataDeposit(
        this.user3,
        this.user1Address,
        seedData.deposit1,
        false,
        seedData.zero,
        seedData.depositNonce1_0,
        seedData.transactionId1,
        seedData.startDatePlus1m,
      );

      await this.user1SQRpProRata.depositSig({
        baseAmount: seedData.deposit1,
        boost: false,
        boostExchangeRate: seedData.zero,
        transactionId: seedData.transactionId1,
        timestampLimit: seedData.startDatePlus1m,
        signature,
      });
    });

    it('owner tries to deploy with invalid start date', async function () {
      await expect(
        getSQRpProRataContext(await getUsers(), {
          ...contractConfig,
          startDate: 1,
        }),
      ).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.startDateMustBeGreaterThanCurrentTime,
      );
    });

    it('owner tries to deploy with invalid close date', async function () {
      await expect(
        getSQRpProRataContext(await getUsers(), {
          ...contractConfig,
          closeDate: 0,
        }),
      ).revertedWithCustomError(
        this.owner2SQRpProRata,
        customError.closeDateMustBeGreaterThanCurrentTime,
      );
    });

    it('owner tries to deploy with zero verifier address', async function () {
      await expect(
        getSQRpProRataContext(await getUsers(), {
          ...contractConfig,
          depositVerifier: ZeroAddress,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.depositVerifierNotZeroAddress);
    });

    it('owner tries to deploy with zero deposit goal', async function () {
      await expect(
        getSQRpProRataContext(await getUsers(), {
          ...contractConfig,
          baseGoal: ZERO,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.goalNotZero);
    });

    it('owner tries to deploy with zero linear boost factor', async function () {
      await expect(
        getSQRpProRataContext(await getUsers(), {
          ...contractConfig,
          linearAllocation: true,
        }),
      ).revertedWithCustomError(this.owner2SQRpProRata, customError.linearBoostFactorNotZero);
    });
  });
}
