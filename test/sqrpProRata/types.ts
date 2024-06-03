import { DepositEvent, WithdrawGoalEvent } from '~typechain-types/contracts/SQRpProRata';
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

export type WithdrawGoalEventArgs = WithdrawGoalEvent.Event & EventArgs<[string, number]>;
