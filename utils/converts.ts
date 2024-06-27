import { BigNumberish } from 'ethers';
import { toWei } from '~common';
import { tokenDecimals } from '~seeds/seedData';

export function toContractWei(value: BigNumberish): bigint {
  return toWei(value, tokenDecimals);
}
