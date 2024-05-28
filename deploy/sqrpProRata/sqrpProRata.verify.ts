import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { callWithTimerHre, verifyContract } from '~common-contract';
import { SQR_P_PRO_RATA_NAME } from '~constants';
import { getAddressesFromHre } from '~utils';
import { getContractArgsEx } from './utils';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment): Promise<void> => {
  await callWithTimerHre(async () => {
    const { sqrpProRataAddress: erc20TokenAddress } = getAddressesFromHre(hre);
    console.log(`${SQR_P_PRO_RATA_NAME} ${erc20TokenAddress} is verify...`);
    const contractArg = getContractArgsEx();
    if (contractArg) {
      console.table(contractArg);
    }
    await verifyContract(erc20TokenAddress, hre, contractArg);
  }, hre);
};

func.tags = [`${SQR_P_PRO_RATA_NAME}:verify`];

export default func;
