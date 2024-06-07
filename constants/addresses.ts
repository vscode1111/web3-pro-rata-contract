import { DeployNetworks } from '~types';

export const SQR_P_PRO_RATA_NAME = 'SQRpProRata';
export const BASE_TOKEN_NAME = 'BaseToken';

export enum CONTRACT_LIST {
  SQR_P_PRO_RATA = 'SQR_P_PRO_RATA',
}

export const CONTRACTS: Record<CONTRACT_LIST, DeployNetworks> = {
  SQR_P_PRO_RATA: {
    // bsc: '0x44fA6D9Ca99b6bECFc23166dA06fFf320Cb20A92', //Test
    // bsc: '0x5b319c9EB219fec7015888E622bD401a1C22322F', //Test
    // bsc: '0xfcE217b570333c9FF5F3a95B7d773Ef1d8aecF7F', //Test
    // bsc: '0xF9d6f73c0bDCd0F2a7734bDCE3aFb9b9030d69F0', //Test - sqrp-gated
    bsc: '0x3721B60822603fB7B13A180BC1E3eDd5330Df827', //Test - simple
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0x5D27C778759e078BBe6D11A6cd802E41459Fe852', //Main - goal: 15 USDT
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0x6fae03D2FbBAf8821DC3248ca61cA239f60A9Bac', //Stage
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0x57c11ef0f8fDbdc376444DE64a03d488BD3b09B8', //Prod
  },
};
