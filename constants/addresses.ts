import { DeployNetworks } from '~types';

export const SQR_P_PRO_RATA_NAME = 'SQRpProRata';
export const ERC20_TOKEN_NAME = 'ERC20Token';

export enum CONTRACT_LIST {
  SQR_P_PRO_RATA = 'SQR_P_PRO_RATA',
}

export const CONTRACTS: Record<CONTRACT_LIST, DeployNetworks> = {
  SQR_P_PRO_RATA: {
    // bsc: '0x020DFF89FF74f58731A1909942E402e46a82AE06', //Test
    // bsc: '0x810C026DCD486482589661306b25eDeF7F4216E9', //Test
    // bsc: '0x7Bb240378255E38cE8882Ce7B2661a446AD8b3B7', //Test
    // bsc: '0x47c2D03fFB3139fa8CD12deF325A9D374b0a5f58', //Test
    //-------------------------------------------------------------------------------------------------------------
    bsc: '0xb33CA002BfAA37CC98Daa6eDc39D9DCBD937873d', //Main - goal: 15 USDT
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '', //Stage
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '', //Prod - pro-rata | Goal: 12 USDT | Close: 07/30
  },
};
