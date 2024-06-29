import { Signer } from 'ethers';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { SQRpProRata } from '~typechain-types/contracts/SQRpProRata';
import { SQRpProRata__factory } from '~typechain-types/factories/contracts/SQRpProRata__factory';

export interface Users {
  owner: Signer;
  ownerAddress: string;
  user1: Signer;
  user1Address: string;
  user2: Signer;
  user2Address: string;
  user3: Signer;
  user3Address: string;
  owner2: Signer;
  owner2Address: string;
  verifier: Signer;
  verifierAddress: string;
}

export interface ERC20TokenContext {
  erc20TokenAddress: string;
  ownerERC20Token: ERC20Token;
  user1ERC20Token: ERC20Token;
  user2ERC20Token: ERC20Token;
  user3ERC20Token: ERC20Token;
  owner2ERC20Token: ERC20Token;
}

export interface BaseTokenContext {
  baseTokenAddress: string;
  ownerBaseToken: ERC20Token;
  user1BaseToken: ERC20Token;
  user2BaseToken: ERC20Token;
  user3BaseToken: ERC20Token;
  owner2BaseToken: ERC20Token;
}

export interface BoostTokenContext {
  boostTokenAddress: string;
  ownerBoostToken: ERC20Token;
  user1BoostToken: ERC20Token;
  user2BoostToken: ERC20Token;
  user3BoostToken: ERC20Token;
  owner2BoostToken: ERC20Token;
}

export interface SQRpProRataContext {
  sqrpProRataFactory: SQRpProRata__factory;
  owner2SqrpProRataFactory: SQRpProRata__factory;
  sqrpProRataAddress: string;
  ownerSQRpProRata: SQRpProRata;
  user1SQRpProRata: SQRpProRata;
  user2SQRpProRata: SQRpProRata;
  user3SQRpProRata: SQRpProRata;
  owner2SQRpProRata: SQRpProRata;
}

export type ContextBase = Users & BaseTokenContext & BoostTokenContext & SQRpProRataContext;
