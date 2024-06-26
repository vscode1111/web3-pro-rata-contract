import { BaseToken } from '~typechain-types/contracts/BaseToken';
import {
  DepositEvent,
  RefundEvent,
  SQRpProRata,
  WithdrawGoalEvent,
} from '~typechain-types/contracts/SQRpProRata';
import { ContextBase } from '~types';

type Fixture<T> = () => Promise<T>;

declare module 'mocha' {
  export interface Context extends ContextBase {
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
  }
}

export interface EventArgs<T> {
  args: T;
}

export type DepositEventArgs = DepositEvent.Event & EventArgs<[string, number]>;

export type RefundEventArgs = RefundEvent.Event & EventArgs<[string, number]>;

export type WithdrawGoalEventArgs = WithdrawGoalEvent.Event & EventArgs<[string, number]>;

export interface DepositResult {
  userAddress: string;
  deposit: bigint;
  allocation: bigint;
  refund: bigint;
  boost?: boolean;
}

export interface DepositRecord extends Partial<DepositResult> {
  deposit: bigint;
  userAddress: string;
  userSQRpProRata: SQRpProRata;
  userBaseToken: BaseToken;
  transactionId: string;
}
