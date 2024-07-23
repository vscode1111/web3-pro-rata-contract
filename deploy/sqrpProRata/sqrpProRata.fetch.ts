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

    const [baseToken, boostToken] = await Promise.all([
      ownerSQRpProRata.baseToken(),
      ownerSQRpProRata.boostToken(),
    ]);

    const [{ ownerERC20Token: ownerBaseToken }, { ownerERC20Token: ownerBoostToken }] =
      await Promise.all([
        getERC20TokenContext(users, baseToken),
        getERC20TokenContext(users, boostToken),
      ]);

    const [baseDecimals, baseTokenName, boostDecimals, boostTokenName] = await Promise.all([
      ownerBaseToken.decimals(),
      ownerBaseToken.name(),
      ownerBoostToken.decimals(),
      ownerBoostToken.name(),
    ]);

    const result = {
      owner: await ownerSQRpProRata.owner(),
      baseToken,
      boostToken,
      depositVerifier: await ownerSQRpProRata.depositVerifier(),
      baseGoal: formatContractToken(await ownerSQRpProRata.baseGoal(), baseDecimals, baseTokenName),
      startDate: formatContractDate(await ownerSQRpProRata.startDate()),
      closeDate: formatContractDate(await ownerSQRpProRata.closeDate()),
      externalRefund: await ownerSQRpProRata.externalRefund(),
      baseBalance: formatContractToken(
        await ownerSQRpProRata.getBaseBalance(),
        baseDecimals,
        baseTokenName,
      ),
      requiredBoostAmount: formatContractToken(
        await ownerSQRpProRata.calculateRequiredBoostAmount(),
        boostDecimals,
        boostTokenName,
      ),
      isReachedBaseGoal: await ownerSQRpProRata.isReachedBaseGoal(),
      isDepositReady: await ownerSQRpProRata.isDepositReady(),
      getDepositRefundFetchReady: await ownerSQRpProRata.getDepositRefundFetchReady(),
    };

    console.table(result);

    await printAccountInfo(
      ownerSQRpProRata,
      users.user1Address,
      baseDecimals,
      baseTokenName,
      boostDecimals,
      boostTokenName,
    );
    await printAccountInfo(
      ownerSQRpProRata,
      users.user2Address,
      baseDecimals,
      baseTokenName,
      boostDecimals,
      boostTokenName,
    );
    await printAccountInfo(
      ownerSQRpProRata,
      '0x2c5459bb28254cc96944c50090f4bd0ef045a937',
      baseDecimals,
      baseTokenName,
      boostDecimals,
      boostTokenName,
    );
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:fetch`];

export default func;
