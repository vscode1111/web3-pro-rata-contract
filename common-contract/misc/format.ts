import { BigNumberish } from 'ethers';
import { formatDate, formatToken } from '~common';

export function printToken(value: BigNumberish, decimals: number, tokenName?: string): string {
  return `${value} (${formatToken(BigInt(value), decimals, tokenName)})`;
}

export function printDate(value: BigNumberish): string {
  const internalValue = Number(value);
  return `${internalValue} (${formatDate(internalValue)})`;
}
