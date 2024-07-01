import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SQR_P_PRO_RATA_NAME } from '~constants';
import { shouldBehaveCorrectDeployment } from './sqrpProRata.behavior.deployment';
import { shouldBehaveCorrectFetching } from './sqrpProRata.behavior.fetching';
import { shouldBehaveCorrectFundingBaseCase } from './sqrpProRata.behavior.funding-base-case';
import { shouldBehaveCorrectFundingDefaultCase } from './sqrpProRata.behavior.funding-default-case';
import { shouldBehaveCorrectFundingDifferentDecimalsCase1 } from './sqrpProRata.behavior.funding-different-decimals-case1';
import { shouldBehaveCorrectFundingDifferentDecimalsCase2 } from './sqrpProRata.behavior.funding-different-decimals-case2';
import { shouldBehaveCorrectFundingEqualCase } from './sqrpProRata.behavior.funding-equal-case';
import { shouldBehaveCorrectFundingLessCase } from './sqrpProRata.behavior.funding-less-case';

describe(SQR_P_PRO_RATA_NAME, function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  shouldBehaveCorrectDeployment();
  shouldBehaveCorrectFetching();
  shouldBehaveCorrectFundingDefaultCase();
  shouldBehaveCorrectFundingEqualCase();
  shouldBehaveCorrectFundingLessCase();
  shouldBehaveCorrectFundingBaseCase();
  shouldBehaveCorrectFundingDifferentDecimalsCase1();
  shouldBehaveCorrectFundingDifferentDecimalsCase2();
});
