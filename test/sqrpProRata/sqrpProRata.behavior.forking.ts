import { mine } from '@nomicfoundation/hardhat-network-helpers';
import appRoot from 'app-root-path';
import { writeFileSync } from 'fs';
import { ethers, upgrades } from 'hardhat';
import { checkFilePathSync, convertArray2DToContent, toNumberDecimals } from '~common';
import { runConcurrently } from '~common-contract';
import { CONTRACTS, SQR_P_PRO_RATA_NAME } from '~constants';
import { printAccountInfo } from '~deploy/sqrpProRata/utils';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { SQRpProRata__factory } from '~typechain-types/factories/contracts/SQRpProRata__factory';
import { DeployNetworks } from '~types';
import { getERC20TokenContext, getUsers } from '~utils';

export interface DepositRefundRecord {
  address: string;
  boosted: boolean;
  baseDeposited: number;
  baseAllocation: number;
  baseRefund: number;
  boostRefund: number;
  nonce: number;
}

export const LINE_SEPARATOR = '\n';
export const CELL_SEPARATOR = ';';
export const SOURCE_NUMBER_DELIMITER = '.';
export const TARGET_NUMBER_DELIMITER = '.';

export const VESTING_TOKEN_PRICE = 0.08;
const DEPOSIT_FIELD_FOR_VESTING_ALLOCATION: keyof DepositRefundRecord = 'baseDeposited'; //baseAllocation (default) or baseDeposited (if goal isn't reached)

export function getExchangeDir() {
  return `${appRoot.toString()}/exchange`;
}

export function toCsvNumber(value: number) {
  return String(value).replace(SOURCE_NUMBER_DELIMITER, TARGET_NUMBER_DELIMITER);
}

export function getFundsFileName(exchangeDir: string, contractAddress: string) {
  return `${exchangeDir}/funds-${contractAddress}.csv`;
}

export function shouldBehaveCorrectForking(): void {
  describe.skip('forking', () => {
    it('incident: analyze real contract', async function () {
      await mine();

      const network: keyof DeployNetworks = 'bsc';

      const sqrpProRataAddress = CONTRACTS.SQR_P_PRO_RATA[network];

      console.log(`Contract address for forking: ${sqrpProRataAddress}`);

      const owner2 = await ethers.getImpersonatedSigner(
        // '0x627Ab3fbC3979158f451347aeA288B0A3A47E1EF', //My s-owner2
        '0xA8B8455ad9a1FAb1d4a3B69eD30A52fBA82549Bb', //Matan
      );
      const users = await getUsers();

      const sqrpProRataFactory = (await ethers.getContractFactory(
        SQR_P_PRO_RATA_NAME,
      )) as unknown as SQRpProRata__factory;

      const owner2ProRataFactory = sqrpProRataFactory.connect(owner2);

      await upgrades.forceImport(sqrpProRataAddress, owner2ProRataFactory);

      const owner2SQRpProRata = (await upgrades.upgradeProxy(
        sqrpProRataAddress,
        owner2ProRataFactory,
      )) as unknown as SQRpProRata;

      const [baseToken, boostToken] = await Promise.all([
        owner2SQRpProRata.baseToken(),
        owner2SQRpProRata.boostToken(),
      ]);

      const [{ ownerERC20Token: ownerBaseToken }, { ownerERC20Token: ownerBoostToken }] =
        await Promise.all([
          getERC20TokenContext(users, baseToken),
          getERC20TokenContext(users, boostToken),
        ]);

      const [baseDecimals, baseTokenName, boostDecimals, boostTokenName, rawAccountCount] =
        await Promise.all([
          ownerBaseToken.decimals(),
          ownerBaseToken.name(),
          ownerBoostToken.decimals(),
          ownerBoostToken.name(),
          owner2SQRpProRata.getAccountCount(),
        ]);

      const accountCount = Number(rawAccountCount);

      console.log(`Account count: ${accountCount}`);

      const depositRefundRecords: DepositRefundRecord[] = [];

      await runConcurrently(
        async (index) => {
          const account = await owner2SQRpProRata.getAccountByIndex(index);
          const { baseDeposited, boosted, baseAllocation, baseRefund, boostRefund, nonce } =
            await owner2SQRpProRata.getDepositRefundAccountInfo(account);

          depositRefundRecords[index] = {
            address: account,
            boosted,
            baseDeposited: toNumberDecimals(baseDeposited, baseDecimals),
            baseAllocation: toNumberDecimals(baseAllocation, baseDecimals),
            baseRefund: toNumberDecimals(baseRefund, baseDecimals),
            boostRefund: toNumberDecimals(boostRefund, boostDecimals),
            nonce: Number(nonce),
          };
        },
        accountCount,
        10,
      );

      let formattedData: string[][] = [
        [
          'Wallet',
          'Base deposited',
          'Boosted',
          'Base allocation',
          'Base refund',
          'Boost refund',
          'Number of deposits',
          'Vesting allocation',
        ],
      ];

      formattedData.push(
        ...depositRefundRecords.map((depositRefundRecord) => {
          const {
            address,
            baseDeposited,
            boosted,
            baseAllocation,
            baseRefund,
            boostRefund,
            nonce,
          } = depositRefundRecord;

          return [
            address,
            toCsvNumber(baseDeposited),
            boosted ? 'true' : 'false',
            toCsvNumber(baseAllocation),
            toCsvNumber(baseRefund),
            toCsvNumber(boostRefund),
            toCsvNumber(nonce),
            toCsvNumber(
              (depositRefundRecord[DEPOSIT_FIELD_FOR_VESTING_ALLOCATION] as number) /
                VESTING_TOKEN_PRICE,
            ),
          ];
        }),
      );

      const exchangeDir = getExchangeDir();
      checkFilePathSync(exchangeDir);

      writeFileSync(
        getFundsFileName(exchangeDir, sqrpProRataAddress),
        convertArray2DToContent(formattedData, LINE_SEPARATOR, CELL_SEPARATOR),
      );

      /// const { baseToken, boostToken } = await owner2SQRpProRata.getDepositRefundTokensInfo();

      await printAccountInfo(
        owner2SQRpProRata,
        '0x56c2A18c0EB6E163AF74f80B48eEe73E892Ec714',
        baseDecimals,
        baseTokenName,
        boostDecimals,
        boostTokenName,
      );

      await printAccountInfo(
        owner2SQRpProRata,
        '0xCafa4F8Eb68Da43331152D6662620d735825cb59',
        baseDecimals,
        baseTokenName,
        boostDecimals,
        boostTokenName,
      );

      // await owner2SQRpProRata.refundAll();
      // await owner2SQRpProRata.calculateBaseSwappedAmountAll();
    }).timeout(600_000);
  });
}
