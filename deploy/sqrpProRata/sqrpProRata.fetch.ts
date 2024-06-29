import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, formatContractDate, formatContractToken } from '~common-contract';
import { SQR_P_PRO_RATA_NAME } from '~constants';
import { getAddressesFromHre, getERC20TokenContext, getSQRpProRataContext, getUsers } from '~utils';
import { printAccountInfo } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is fetching...`);
    const users = await getUsers();
    const { ownerSQRpProRata } = await getSQRpProRataContext(users, sqrpProRataAddress);

    const baseToken = await ownerSQRpProRata.baseToken();

    const { ownerERC20Token } = await getERC20TokenContext(users, baseToken);

    const decimals = await ownerERC20Token.decimals();
    const tokenName = await ownerERC20Token.name();

    const result = {
      owner: await ownerSQRpProRata.owner(),
      baseToken,
      depositVerifier: await ownerSQRpProRata.depositVerifier(),
      baseGoal: formatContractToken(await ownerSQRpProRata.baseGoal(), decimals, tokenName),
      startDate: formatContractDate(await ownerSQRpProRata.startDate()),
      closeDate: formatContractDate(await ownerSQRpProRata.closeDate()),
      baseBalance: formatContractToken(
        await ownerSQRpProRata.getBaseBalance(),
        decimals,
        tokenName,
      ),
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
