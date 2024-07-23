import { mine } from '@nomicfoundation/hardhat-network-helpers';
import { ethers, upgrades } from 'hardhat';
import { CONTRACTS, SQR_P_PRO_RATA_NAME } from '~constants';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { SQRpProRata__factory } from '~typechain-types/factories/contracts/SQRpProRata__factory';
import { DeployNetworks } from '~types';

export function shouldBehaveCorrectForking(): void {
  describe.skip('forking', () => {
    it('incident: buy token of collection #1 in 38747028 block', async function () {
      await mine();

      const network: keyof DeployNetworks = 'bsc';

      const sqrpProRataAddress = CONTRACTS.SQR_P_PRO_RATA[network];

      console.log(`Contract address for forking: ${sqrpProRataAddress}`);

      const owner2 = await ethers.getImpersonatedSigner(
        '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF',
      );

      // const context = await getSQRpProRataContext(users, sqrpProRataAddress);
      // const { sqrpProRataFactory } = context;

      const sqrpProRataFactory = (await ethers.getContractFactory(
        SQR_P_PRO_RATA_NAME,
      )) as unknown as SQRpProRata__factory;

      const owner2ProRataFactory = sqrpProRataFactory.connect(owner2);

      await upgrades.forceImport(sqrpProRataAddress, owner2ProRataFactory);

      const owner2SQRpProRata = (await upgrades.upgradeProxy(
        sqrpProRataAddress,
        owner2ProRataFactory,
      )) as unknown as SQRpProRata;

      const accountInfo = await owner2SQRpProRata.fetchAccountInfo(
        '0xc109D9a3Fc3779db60af4821AE18747c708Dfcc6',
      );
      console.log(222, accountInfo);

      // await owner2SQRpProRata.refundAll();
      await owner2SQRpProRata.calculateBaseSwappedAmountAll();
    });
  });
}
