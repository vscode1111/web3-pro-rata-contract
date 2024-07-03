import { ContractConfig, TokenConfig } from '~seeds';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';

export interface SQRpProRataFixtureParamConfig {
  baseTokenConfig?: Partial<TokenConfig>;
  boostTokenConfig?: Partial<TokenConfig>;
  contractConfig?: Partial<ContractConfig>;
}

export interface DepositBase {
  deposit: bigint;
  allocation: bigint;
  refund: bigint;
  boost?: boolean;
}

export type UserType = 'user1' | 'user2' | 'user3' | 'owner2';

export type UserContractType = UserType | 'contract';

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
  share: bigint;
}

export interface DepositRecord {
  user: UserType;
  baseDeposit: bigint;
  transactionId?: string;
  boost?: boolean;
  boostExchangeRate?: bigint;
}

export interface UserEnvironment {
  userAddress: string;
  userBaseToken: ERC20Token;
  userBoostToken: ERC20Token;
  userSQRpProRata: SQRpProRata;
}

export interface UserContractEnvironment {
  address: string;
}

export interface UserInfo {
  user: UserType;
  baseBalance: number;
  boostBalance: number;
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

export interface CaseExpectation {
  userExpectations?: Partial<Record<UserType, UserExpectation>>;
  baseBalanceDelta?: bigint;
  boostBalanceDelta?: bigint;
}
