import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { toNumberDecimals } from '~common';
import { callWithTimerHre, waitTx } from '~common-contract';
import { MATAN_WALLET, WEB3_P_PRO_RATA_NAME, TX_OVERRIDES } from '~constants';
import { contractConfig } from '~seeds';
import { getAddressesFromHre, getContext, getUsers } from '~utils';
import { getBaseTokenInfo } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3ProRataAddress } = getAddressesFromHre(hre);
    console.log(`${WEB3_P_PRO_RATA_NAME} ${web3ProRataAddress} is changing base goal to user...`);
    const users = await getUsers();
    const { baseToken: baseTokenAddress, boostToken: boostTokenAddress } = contractConfig;
    const context = await getContext(baseTokenAddress, boostTokenAddress, web3ProRataAddress);
    const { owner2WEB3ProRata } = context;
    const { decimals, tokenName } = await getBaseTokenInfo(users, owner2WEB3ProRata);

    const amount = await owner2WEB3ProRata.getBaseBalance();
    console.log(`${toNumberDecimals(amount, decimals)} ${tokenName} in contract`);

    const params = {
      newOwner: MATAN_WALLET,
    };

    console.table(params);
    await waitTx(
      owner2WEB3ProRata.transferOwnership(params.newOwner, TX_OVERRIDES),
      'transferOwnership',
    );
  }, hre);
};

func.tags = [`${WEB3_P_PRO_RATA_NAME}:transfer-ownership`];

export default func;
