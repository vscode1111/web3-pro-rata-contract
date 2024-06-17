import { toUnixTime, toWei } from '~common';
import { tokenDecimals } from '~seeds';

export const verifyRequired = false;
export const verifyArgsRequired = false;

const isTiny = false;

export const deployData = {
  now: toUnixTime(),
  nullAddress: '0x0000000000000000000000000000000000000000',
  userMintAmount: 100000,
  deposit1: isTiny ? toWei(0.001, tokenDecimals) : toWei(7_000, tokenDecimals),
  deposit2: isTiny ? toWei(0.002, tokenDecimals) : toWei(4_000, tokenDecimals),
};

export const deployParams = {
  attempts: 1,
  delay: 0,
};

// export function getDeployParams(contractFactory?: ContractFactory) {
//   return [TX_ATTEMPT, 0, contractFactory];
// }
