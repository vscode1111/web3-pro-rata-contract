import dayjs, { Dayjs } from 'dayjs';
import { Numeric } from 'ethers';
import { MS_IN_SEC } from './constants';
import { toNumberDecimalsFixed } from './converts';

export function formatDate(date: Date | Dayjs | number): string {
  if (typeof date === 'number') {
    return dayjs(date * MS_IN_SEC)
      .utc()
      .format('YYYY-MM-DD HH:mm:ss');
  }

  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

export function formatToken(value: bigint, decimals: Numeric = 18, tokenName?: string): string {
  return `${toNumberDecimalsFixed(value, decimals)}${tokenName ? ` ${tokenName}` : ``}`;
}
