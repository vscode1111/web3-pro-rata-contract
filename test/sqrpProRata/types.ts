import {
  CalculateBaseSwappedAmountEvent,
  ChangeBaseGoalEvent,
  DepositEvent,
  ForceWithdrawEvent,
  RefundEvent,
  WithdrawBaseGoalEvent,
  WithdrawExcessTokensEvent,
  WithdrawSwappedAmountEvent,
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

export type DepositEventArgs = DepositEvent.Event & EventArgs<[string, boolean, bigint, bigint]>;

export type RefundEventArgs = RefundEvent.Event & EventArgs<[string, boolean, bigint, bigint]>;

export type WithdrawBaseGoalEventArgs = WithdrawBaseGoalEvent.Event & EventArgs<[string, bigint]>;

export type WithdrawSwappedAmountEventArgs = WithdrawSwappedAmountEvent.Event &
  EventArgs<[string, bigint]>;

export type WithdrawExcessTokensEventArgs = WithdrawExcessTokensEvent.Event &
  EventArgs<[string, bigint, bigint]>;

export type ForceWithdrawEventArgs = ForceWithdrawEvent.Event & EventArgs<[string, string, bigint]>;

export type CalculateBaseSwappedAmountEventArgs = CalculateBaseSwappedAmountEvent.Event &
  EventArgs<[bigint, bigint]>;

export type ChangeBaseGoalEventArgs = ChangeBaseGoalEvent.Event &
  EventArgs<[string, bigint, bigint]>;
