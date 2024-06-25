import { TOKENS_DESCRIPTIONS } from '~constants';
import { TokenAddressDescription } from '~types';

export function getTokenDescription(address: string): TokenAddressDescription {
  const tokenDescription = TOKENS_DESCRIPTIONS[address];

  return {
    ...tokenDescription,
    address,
  };
}

export function calculateAccountRefund(
  goal: bigint,
  userDeposited: bigint,
  totalDeposited: bigint,
): bigint {
  return ((totalDeposited - goal) * userDeposited) / totalDeposited;
}
