import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SQR_P_PRO_RATA_NAME } from '~constants';
import { shouldBehaveCorrectDeployment } from './sqrpProRata.behavior.deployment';
import { shouldBehaveCorrectFetching } from './sqrpProRata.behavior.fetching';
import { shouldBehaveCorrectFunding } from './sqrpProRata.behavior.funding';

describe(SQR_P_PRO_RATA_NAME, function () {
  before(async function () {
    this.loadFixture = loadFixture;
  });

  shouldBehaveCorrectDeployment();
  shouldBehaveCorrectFetching();
  shouldBehaveCorrectFunding();
});
