import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { WEB3_P_PRO_RATA_NAME } from '~constants';
import { shouldBehaveCorrectDeployment } from './web3ProRata.behavior.deployment';
import { shouldBehaveCorrectFetching } from './web3ProRata.behavior.fetching';
import { shouldBehaveCorrectForking } from './web3ProRata.behavior.forking';
import { shouldBehaveCorrectFundingDefaultCase } from './web3ProRata.behavior.funding-default-case';
import { shouldBehaveCorrectFundingDifferentDecimalsCase1 } from './web3ProRata.behavior.funding-different-decimals-case1';
import { shouldBehaveCorrectFundingDifferentDecimalsCase2 } from './web3ProRata.behavior.funding-different-decimals-case2';
import { shouldBehaveCorrectFundingEqualCase } from './web3ProRata.behavior.funding-equal-case';
import { shouldBehaveCorrectFundingLessCase } from './web3ProRata.behavior.funding-less-case';
import { shouldBehaveCorrectFundingNegativeCases } from './web3ProRata.behavior.funding-negative-cases';
import { shouldBehaveCorrectFundingNegativeCasesExternal } from './web3ProRata.behavior.funding-negative-cases-external';
import { shouldBehaveCorrectFundingPositiveCasesInternal } from './web3ProRata.behavior.funding-positive-cases-internal';
import { shouldBehaveCorrectFundingPositiveCasesInternalLinear } from './web3ProRata.behavior.funding-positive-cases-internal-linear';

describe(WEB3_P_PRO_RATA_NAME, function () {
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
  shouldBehaveCorrectFundingPositiveCasesInternalLinear();
});
