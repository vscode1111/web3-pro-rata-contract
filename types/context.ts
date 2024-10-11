import { Signer } from 'ethers';
import { ERC20Token } from '~typechain-types/contracts/ERC20Token';
import { WEB3ProRata } from '~typechain-types/contracts/WEB3ProRata';
import { WEB3ProRata__factory } from '~typechain-types/factories/contracts/WEB3ProRata__factory';

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
  depositVerifier: Signer;
  depositVerifierAddress: string;
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

export interface WEB3ProRataContext {
  web3ProRataFactory: WEB3ProRata__factory;
  owner2Web3pProRataFactory: WEB3ProRata__factory;
  web3ProRataAddress: string;
  ownerWEB3ProRata: WEB3ProRata;
  user1WEB3ProRata: WEB3ProRata;
  user2WEB3ProRata: WEB3ProRata;
  user3WEB3ProRata: WEB3ProRata;
  owner2WEB3ProRata: WEB3ProRata;
}

export type ContextBase = Users & BaseTokenContext & BoostTokenContext & WEB3ProRataContext;
