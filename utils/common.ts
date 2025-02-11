import dayjs, { Dayjs } from 'dayjs';
import { Signer } from 'ethers';
import { signEncodedMessage, toUnixTime } from '~common';

export async function signMessageForProRataDeposit(
  signer: Signer,
  account: string,
  amount: bigint,
  boost: boolean,
  boostExchangeRate: bigint,
  nonce: number,
  transactionId: string,
  timestampLimit: number,
) {
  return signEncodedMessage(
    signer,
    //  account, amount, boost, amountRatio, nonce, transactionId, timestampLimit
    ['address', 'uint256', 'bool', 'uint256', 'uint32', 'string', 'uint32'],
    [account, amount, boost, boostExchangeRate, nonce, transactionId, timestampLimit],
  );
}

export function addSecondsToUnixTime(date: number | Dayjs, seconds: number) {
  if (typeof date === 'number')
    return toUnixTime(
      dayjs(date * 1000)
        .add(seconds, 'seconds')
        .toDate(),
    );

  return toUnixTime(date.add(seconds, 'seconds').toDate());
}
