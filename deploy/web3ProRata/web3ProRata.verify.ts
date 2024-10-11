import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, verifyContract } from '~common-contract';
import { WEB3_P_PRO_RATA_NAME } from '~constants';
import { getAddressesFromHre } from '~utils';
import { getContractArgsEx } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { web3ProRataAddress } = getAddressesFromHre(hre);
    console.log(`${WEB3_P_PRO_RATA_NAME} ${web3ProRataAddress} is verify...`);
    const contractArg = getContractArgsEx();
    if (contractArg) {
      console.table(contractArg);
    }
    await verifyContract(web3ProRataAddress, hre, contractArg);
  }, hre);
};

func.tags = [`${WEB3_P_PRO_RATA_NAME}:verify`];

export default func;
