import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import { config as dotenvConfig } from 'dotenv';
import 'hardhat-deploy';
import type { HardhatUserConfig } from 'hardhat/config';
import type { HardhatNetworkAccountUserConfig, NetworkUserConfig } from 'hardhat/types';
import { resolve } from 'path';
import 'tsconfig-paths/register';
import { toBoolean } from '~common';
import { DeployNetworks } from '~types';
import { getEnv } from './common/config';

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || './.env';
dotenvConfig({
  path: resolve(__dirname, dotenvConfigPath),
});

const isCoverage = toBoolean(process.env.COVERAGE);
const gasReporterEnable = false;
const forkingEnable = false;
const forkingBlockNumber = 40976071;

function getAccounts() {
  return [
    `0x${getEnv('OWNER_PRIVATE_KEY')}`,
    `0x${getEnv('USER1_PRIVATE_KEY')}`,
    `0x${getEnv('USER2_PRIVATE_KEY')}`,
    `0x${getEnv('USER3_PRIVATE_KEY')}`,
    `0x${getEnv('OWNER2_PRIVATE_KEY')}`,
    `0x${getEnv('VERIFIER_PRIVATE_KEY')}`,
  ];
}

function getNetworkAccounts(): HardhatNetworkAccountUserConfig[] {
  return getAccounts().map((account) => ({
    privateKey: account,
    balance: '1000000000000000000',
  }));
}

function getChainConfig(
  chain: keyof DeployNetworks,
  chainId?: number,
): NetworkUserConfig & { url?: string } {
  return {
    chainId,
    url: getEnv(`${chain.toUpperCase()}_PROVIDER_URL`),
    accounts: getAccounts(),
  };
}

export const defaultNetwork: keyof DeployNetworks = 'bsc';

const config: HardhatUserConfig = {
  defaultNetwork: isCoverage ? 'hardhat' : defaultNetwork,
  etherscan: {
    apiKey: {
      bsc: getEnv('BSC_SCAN_API_KEY'),
    },
  },
  gasReporter: {
    enabled: gasReporterEnable,
    currency: 'USD',
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      forking: {
        enabled: forkingEnable,
        url: getChainConfig(defaultNetwork).url ?? '',
        blockNumber: forkingBlockNumber,
      },
      initialBaseFeePerGas: 0,
      mining: {
        auto: true,
      },
      gasPrice: 1,
      accounts: getNetworkAccounts(),
    },
    bsc: getChainConfig('bsc'),
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  solidity: {
    version: '0.8.21',
    settings: {
      metadata: {
        bytecodeHash: 'none',
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    // outDir: "types",
    target: 'ethers-v6',
  },
};

export default config;
