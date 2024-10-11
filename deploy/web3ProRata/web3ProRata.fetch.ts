import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  callWithTimerHre,
  formatContractDate,
  formatContractToken,
  printToken,
} from '~common-contract';
import { WEB3_P_PRO_RATA_NAME } from '~constants';
import { getAddressesFromHre, getERC20TokenContext, getWEB3ProRataContext, getUsers } from '~utils';
import { printAccountInfo } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3ProRataAddress } = getAddressesFromHre(hre);
    console.log(`${WEB3_P_PRO_RATA_NAME} ${web3ProRataAddress} is fetching...`);
    const users = await getUsers();
    const { ownerWEB3ProRata } = await getWEB3ProRataContext(users, web3ProRataAddress);

    const [baseToken, boostToken] = await Promise.all([
      ownerWEB3ProRata.baseToken(),
      ownerWEB3ProRata.boostToken(),
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
      owner: await ownerWEB3ProRata.owner(),
      baseToken,
      boostToken,
      depositVerifier: await ownerWEB3ProRata.depositVerifier(),
      baseGoal: formatContractToken(await ownerWEB3ProRata.baseGoal(), baseDecimals, baseTokenName),
      startDate: formatContractDate(await ownerWEB3ProRata.startDate()),
      closeDate: formatContractDate(await ownerWEB3ProRata.closeDate()),
      externalRefund: await ownerWEB3ProRata.externalRefund(),
      linearAllocation: await ownerWEB3ProRata.linearAllocation(),
      linearBoostFactor: printToken(await ownerWEB3ProRata.linearBoostFactor()),
      baseBalance: formatContractToken(
        await ownerWEB3ProRata.getBaseBalance(),
        baseDecimals,
        baseTokenName,
      ),
      requiredBoostAmount: formatContractToken(
        await ownerWEB3ProRata.calculateRequiredBoostAmount(),
        boostDecimals,
        boostTokenName,
      ),
      totalBaseSwappedAmount: formatContractToken(
        await ownerWEB3ProRata.totalBaseSwappedAmount(),
        baseDecimals,
        baseTokenName,
      ),
      totalBaseNonBoostDeposited: formatContractToken(
        await ownerWEB3ProRata.totalBaseNonBoostDeposited(),
        baseDecimals,
        baseTokenName,
      ),
      totalBaseBoostDeposited: formatContractToken(
        await ownerWEB3ProRata.totalBaseBoostDeposited(),
        baseDecimals,
        baseTokenName,
      ),
      totalBaseDeposited: formatContractToken(
        await ownerWEB3ProRata.totalBaseDeposited(),
        baseDecimals,
        baseTokenName,
      ),
      isReachedBaseGoal: await ownerWEB3ProRata.isReachedBaseGoal(),
      isDepositReady: await ownerWEB3ProRata.isDepositReady(),
      getDepositRefundFetchReady: await ownerWEB3ProRata.getDepositRefundFetchReady(),
    };

    console.table(result);

    await printAccountInfo(
      ownerWEB3ProRata,
      users.user1Address,
      baseDecimals,
      baseTokenName,
      boostDecimals,
      boostTokenName,
    );
    await printAccountInfo(
      ownerWEB3ProRata,
      users.user2Address,
      baseDecimals,
      baseTokenName,
      boostDecimals,
      boostTokenName,
    );
    // await printAccountInfo(
    //   ownerWEB3ProRata,
    //   '0x65BdF8887fded456CC456C1be0907BD4369E466b',
    //   baseDecimals,
    //   baseTokenName,
    //   boostDecimals,
    //   boostTokenName,
    // );
    // await printAccountInfo(
    //   ownerWEB3ProRata,
    //   '0xCafa4F8Eb68Da43331152D6662620d735825cb59',
    //   baseDecimals,
    //   baseTokenName,
    //   boostDecimals,
    //   boostTokenName,
    // );
  }, hre);
};

func.tags = [`${WEB3_P_PRO_RATA_NAME}:fetch`];

export default func;
