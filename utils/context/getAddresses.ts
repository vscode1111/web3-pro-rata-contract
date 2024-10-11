import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getNetworkName } from '~common-contract';
import { CONTRACTS } from '~constants';
import { Addresses, DeployNetworks } from '~types';

export function getAddresses(network: keyof DeployNetworks): Addresses {
  const web3ProRataAddress = CONTRACTS.WEB3_P_PRO_RATA[network];
  return {
    web3ProRataAddress,
  };
}

export function getAddressesFromHre(hre: HardhatRuntimeEnvironment) {
  return getAddresses(getNetworkName(hre));
}
