import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, printDate, printToken } from '~common-contract';
import { SQR_P_PRO_RATA_NAME } from '~constants';
import { getAddressesFromHre, getERC20TokenContext, getSQRpProRataContext, getUsers } from '~utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress } = await getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${sqrpProRataAddress} is fetching...`);
    const users = await getUsers();
    const { ownerSQRpProRata } = await getSQRpProRataContext(users, sqrpProRataAddress);

    const erc20Token = await ownerSQRpProRata.erc20Token();

    const { ownerERC20Token } = await getERC20TokenContext(users, erc20Token);

    const decimals = Number(await ownerERC20Token.decimals());
    const tokenName = await ownerERC20Token.name();

    const result = {
      owner: await ownerSQRpProRata.owner(),
      erc20Token,
      verifier: await ownerSQRpProRata.verifier(),
      goal: printToken(await ownerSQRpProRata.goal(), decimals, tokenName),
      startDate: printDate(await ownerSQRpProRata.startDate()),
      closeDate: printDate(await ownerSQRpProRata.closeDate()),
      coldWallet: await ownerSQRpProRata.coldWallet(),
      balanceLimit: printToken(await ownerSQRpProRata.balanceLimit(), decimals, tokenName),
      balance: printToken(await ownerSQRpProRata.getBalance(), decimals, tokenName),
    };

    console.table(result);

    const fundItem = await ownerSQRpProRata.fetchFundItem('f80f623b-4e53-4769-9fe7-93d0901c7261');
    console.log(fundItem);
    const depositNonce = await ownerSQRpProRata.getNonce(users.user2Address);
    console.log(depositNonce);
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:fetch`];

export default func;
