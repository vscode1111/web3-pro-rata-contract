import { BigNumberish } from 'ethers';
import { toWei } from '~common';
import { BASE_DECIMALS, BOOST_DECIMALS } from '~constants';

export function toBaseTokenWei(value: BigNumberish): bigint {
  return toWei(value, BASE_DECIMALS);
}

export function toBoostTokenWei(value: BigNumberish): bigint {
  return toWei(value, BOOST_DECIMALS);
}
