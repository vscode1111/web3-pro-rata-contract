import { ChangeBalanceLimitEvent, DepositEvent } from '~typechain-types/contracts/SQRpProRata';
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

export type ChangeBalanceLimitArgs = ChangeBalanceLimitEvent.Event & EventArgs<[string, bigint]>;

export type DepositEventArgs = DepositEvent.Event & EventArgs<[string, number]>;
