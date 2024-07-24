import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SQR_P_PRO_RATA_NAME } from '~constants';
import { shouldBehaveCorrectDeployment } from './sqrpProRata.behavior.deployment';
import { shouldBehaveCorrectFetching } from './sqrpProRata.behavior.fetching';
import { shouldBehaveCorrectForking } from './sqrpProRata.behavior.forking';
import { shouldBehaveCorrectFundingDefaultCase } from './sqrpProRata.behavior.funding-default-case';
import { shouldBehaveCorrectFundingDifferentDecimalsCase1 } from './sqrpProRata.behavior.funding-different-decimals-case1';
import { shouldBehaveCorrectFundingDifferentDecimalsCase2 } from './sqrpProRata.behavior.funding-different-decimals-case2';
import { shouldBehaveCorrectFundingEqualCase } from './sqrpProRata.behavior.funding-equal-case';
import { shouldBehaveCorrectFundingLessCase } from './sqrpProRata.behavior.funding-less-case';
import { shouldBehaveCorrectFundingNegativeCases } from './sqrpProRata.behavior.funding-negative-cases';
import { shouldBehaveCorrectFundingNegativeCasesExternal } from './sqrpProRata.behavior.funding-negative-cases-external';
import { shouldBehaveCorrectFundingPositiveCasesInternal } from './sqrpProRata.behavior.funding-positive-cases-internal';

describe(SQR_P_PRO_RATA_NAME, function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  shouldBehaveCorrectDeployment();
  shouldBehaveCorrectFetching();
  shouldBehaveCorrectFundingDefaultCase();
  shouldBehaveCorrectFundingDifferentDecimalsCase1();
  shouldBehaveCorrectFundingDifferentDecimalsCase2();
  shouldBehaveCorrectFundingEqualCase();
  shouldBehaveCorrectFundingLessCase();
  shouldBehaveCorrectFundingNegativeCasesExternal();
  shouldBehaveCorrectFundingNegativeCases();
  shouldBehaveCorrectFundingPositiveCasesInternal();
  shouldBehaveCorrectForking();
});
