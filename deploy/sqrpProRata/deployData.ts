import { toUnixTime } from '~common';
import { toBaseTokenWei } from '~utils';

export const verifyRequired = false;
export const verifyArgsRequired = false;

const isTiny = false;

export const deployData = {
  now: toUnixTime(),
  nullAddress: '0x0000000000000000000000000000000000000000',
  userMintAmount: 100000,
  deposit1: isTiny ? toBaseTokenWei(0.001) : toBaseTokenWei(7_000),
  deposit2: isTiny ? toBaseTokenWei(0.002) : toBaseTokenWei(4_000),
};

export const deployParams = {
  attempts: 1,
  delay: 0,
};
