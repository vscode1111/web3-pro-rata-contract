import { ContractConfig, TokenConfig } from '~seeds';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { WEB3ProRata } from '~typechain-types/contracts/WEB3ProRata';

export interface WEB3ProRataFixtureParamConfig {
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

export type UserType = 'user1' | 'user2' | 'user3' | 'owner2' | 'contract';

// export type UserContractType = UserType | 'contract';

export interface AccountInfoResult {
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
  boostAverageExchangeRate: bigint;
  share: bigint;
}

export interface DepositRecord {
  user: UserType;
  baseDeposit: bigint;
  transactionId?: string;
  boost?: boolean;
  boostExchangeRate?: bigint;
  revertDeposit?: string;
  expectedTotalBaseNonBoostDeposited?: bigint;
  expectedTotalBaseBoostDeposited?: bigint;
  expectedTotalBaseDeposited?: bigint;
}
export interface FormattedDepositRecord extends DepositRecord {
  totalBaseNonBoostDeposited: bigint;
  totalBaseBoostDeposited: bigint;
  totalBaseDeposited: bigint;
}

export interface UserEnvironment {
  userAddress: string;
  userBaseToken: ERC20Token;
  userBoostToken: ERC20Token;
  userWEB3ProRata: WEB3ProRata;
}

export interface UserContractEnvironment {
  address: string;
}

export interface UserInfo {
  baseBalance: bigint;
  boostBalance: bigint;
}

export interface PrintUserInfo {
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
  boostAverageExchangeRate?: bigint;
  diffBaseBalance?: bigint;
  diffBoostBalance?: bigint;
}

export interface CaseBehaviour {
  invokeWithdrawBaseSwappedAmount?: boolean;
  sendTokensToContract?: {
    baseAmount?: bigint;
    boostAmount?: bigint;
  };
  withdrawTokensFromContract?: {
    baseAmount?: bigint;
    boostAmount?: bigint;
  };
  expectedExcessBoostAmount?: bigint;
  expectedRevertWithdrawBaseSwappedAmount?: string;
  expectedRevertWithdrawExcessTokens?: string;
  userExpectations?: Partial<Record<UserType, UserExpectation>>;
  baseBalanceDelta?: bigint;
  boostBalanceDelta?: bigint;
  requiredBoostAmount?: bigint;
  expectedRevertRefundAll?: string;
}

export type UserInfos = Record<UserType, UserInfo>;
