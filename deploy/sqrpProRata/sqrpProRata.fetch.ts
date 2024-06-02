import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, printDate, printToken } from '~common-contract';
import { SQR_P_PRO_RATA_NAME } from '~constants';
import { getAddressesFromHre, getBaseTokenContext, getSQRpProRataContext, getUsers } from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = await getAddressesFromHre(hre);
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
      goal: printToken(await ownerSQRpProRata.goal(), decimals, tokenName),
      startDate: printDate(await ownerSQRpProRata.startDate()),
      closeDate: printDate(await ownerSQRpProRata.closeDate()),
      balance: printToken(await ownerSQRpProRata.getBalance(), decimals, tokenName),
    };

    console.table(result);

    const user = await ownerSQRpProRata.fetchUser('f80f623b-4e53-4769-9fe7-93d0901c7261');
    console.log(user);
    const depositNonce = await ownerSQRpProRata.getNonce(users.user2Address);
    console.log(depositNonce);
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:fetch`];

export default func;
