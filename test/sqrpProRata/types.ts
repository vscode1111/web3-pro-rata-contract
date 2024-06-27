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

export interface DepositBase {
  deposit: bigint;
  allocation: bigint;
  refund: bigint;
  boost?: boolean;
}

export type UserType = 'user1' | 'user2' | 'user3';

export interface DepositResult {
  user: UserType;
  baseDeposited: bigint;
  baseAllocation: bigint;
  baseDeposit: bigint;
  baseRefund: bigint;
  baseRefunded: bigint;
  boostDeposit: bigint;
  boostRefund: bigint;
  boostRefunded: bigint;
  nonce: bigint;
  boosted: boolean;
  boostAverageRate: bigint;
}

export interface DepositRecord {
  user: UserType;
  baseDeposit: bigint;
  transactionId?: string;
  boost?: boolean;
  boostRatio?: bigint;
}

export interface UserEnvironment {
  userAddress: string;
  userSQRpProRata: SQRpProRata;
  userBaseToken: BaseToken;
}

export interface UserExpectation {
  baseDeposited?: bigint;
  baseAllocation?: bigint;
  baseDeposit?: bigint;
  baseRefund?: bigint;
  baseRefunded?: bigint;
  boostDeposit?: bigint;
  boostRefund?: bigint;
  boostRefunded?: bigint;
  nonce?: number;
  boosted?: boolean;
  boostAverageRate?: bigint;
}

export interface CaseExpectations {
  userExpectations?: Partial<Record<UserType, UserExpectation>>;
}
