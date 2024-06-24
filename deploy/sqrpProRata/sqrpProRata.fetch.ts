import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, printDate, printToken } from '~common-contract';
import { SQR_P_PRO_RATA_NAME } from '~constants';
import { getAddressesFromHre, getBaseTokenContext, getSQRpProRataContext, getUsers } from '~utils';
import { printAccountInfo } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is fetching...`);
    const users = await getUsers();
    const { ownerSQRpProRata } = await getSQRpProRataContext(users, sqrpProRataAddress);

    const baseToken = await ownerSQRpProRata.baseToken();

    const { ownerBaseToken } = await getBaseTokenContext(users, baseToken);

    const decimals = Number(await ownerBaseToken.decimals());
    const tokenName = await ownerBaseToken.name();

    const result = {
      owner: await ownerSQRpProRata.owner(),
      baseToken,
      verifier: await ownerSQRpProRata.verifier(),
      baseGoal: printToken(await ownerSQRpProRata.baseGoal(), decimals, tokenName),
      startDate: printDate(await ownerSQRpProRata.startDate()),
      closeDate: printDate(await ownerSQRpProRata.closeDate()),
      baseBalance: printToken(await ownerSQRpProRata.getBaseBalance(), decimals, tokenName),
    };

    console.table(result);

    await printAccountInfo(ownerSQRpProRata, users.user1Address, decimals, tokenName);
    await printAccountInfo(ownerSQRpProRata, users.user2Address, decimals, tokenName);
    // await printAccountInfo(
    //   ownerSQRpProRata,
    //   '0x2C5459BB28254cc96944c50090f4Bd0eF045A937',
    //   decimals,
    //   tokenName,
    // );
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:fetch`];

export default func;
