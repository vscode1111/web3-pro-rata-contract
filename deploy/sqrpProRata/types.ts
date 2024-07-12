export interface DepositSigParams {
  account: string;
  baseAmount: bigint;
  nonce: number;
  boost: boolean;
  boostExchangeRate: bigint;
  transactionId: string;
  timestampLimit: number;
  signature: string;
}

export interface DepositSigParamsForFront extends Partial<DepositSigParams> {
  amount: number;
  contractAddress: string;
  boosted: boolean;
  amountInWei: string;
  exchangeRateInWei: string;
  timeStampLimit: number;
}
