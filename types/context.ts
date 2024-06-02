import { Signer } from 'ethers';
import { BaseToken } from '~typechain-types/contracts/BaseToken';
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

export interface BaseTokenContext {
  baseTokenAddress: string;
  ownerBaseToken: BaseToken;
  user1BaseToken: BaseToken;
  user2BaseToken: BaseToken;
  user3BaseToken: BaseToken;
  owner2BaseToken: BaseToken;
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

export type ContextBase = Users & BaseTokenContext & SQRpProRataContext;
