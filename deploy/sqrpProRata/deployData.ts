import { toUnixTime } from '~common';
import { toBaseTokenWei } from '~utils';

export const verifyRequired = false;
export const verifyArgsRequired = false;

const isTiny = true;

export const deployData = {
  now: toUnixTime(),
  nullAddress: '0x0000000000000000000000000000000000000000',
  userMintAmount: 100000,
  deposit1: toBaseTokenWei(isTiny ? 0.001 : 7_000),
  deposit2: toBaseTokenWei(isTiny ? 0.002 : 4_000),
};

export const deployParams = {
  attempts: 1,
  delay: 0,
};
