import {
  DepositEvent,
  ForceWithdrawEvent,
  RefundEvent,
  WithdrawBaseGoalEvent,
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

export type DepositEventArgs = DepositEvent.Event & EventArgs<[string, boolean, number, number]>;

export type RefundEventArgs = RefundEvent.Event & EventArgs<[string, boolean, number, number]>;

export type WithdrawBaseGoalEventArgs = WithdrawBaseGoalEvent.Event & EventArgs<[string, number]>;

export type ForceWithdrawEventArgs = ForceWithdrawEvent.Event & EventArgs<[string, string, number]>;
