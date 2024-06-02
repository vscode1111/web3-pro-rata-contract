import { DeployNetworks } from '~types';

export const SQR_P_PRO_RATA_NAME = 'SQRpProRata';
export const BASE_TOKEN_NAME = 'BaseToken';

export enum CONTRACT_LIST {
  SQR_P_PRO_RATA = 'SQR_P_PRO_RATA',
}

export const CONTRACTS: Record<CONTRACT_LIST, DeployNetworks> = {
  SQR_P_PRO_RATA: {
    // bsc: '0xC85AC922880b2eD44a2D9a78739740990B6219f5', //Test
    // bsc: '0x7D82090d0f7901Dfe612486E6D5A9A1d1c6e5f62', //Test
    // bsc: '0x82eFbC9ec9546b78aD223dE39eBD1D5F9243E18f', //Test
    // bsc: '0x258AF60a788fef0289994997c813D5933AcCd52A', //Test
    // bsc: '0x258AF60a788fef0289994997c813D5933AcCd52A', //Test
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0x5D27C778759e078BBe6D11A6cd802E41459Fe852', //Main - fcfs [Upgraded]
    // bsc: '0xe561e403093A19A770d5EE515aC1d5434275c026', //Main - sqrp-gated [Upgraded]
    // bsc: '0x8e6585Dd84c1cDc340727f66183992AaCe7Bfc18', //Main - white-list [Upgraded]
    // bsc: '0x88fD85b2621b6C9548A404eA250376AC5BEFeC13', //Main - fcfs - goal: 100K [Upgraded]
    // bsc: '0x48f4b9A3A95d97B62D1958Dbd5Bd3f906242A762', //Main - sqrp-gated - goal: 100 - 27 Apr - 30 Apr [Upgraded]
    // bsc: '0x43e278854ae4a7b9b7dB7Dfb7cc7d60FEB2304f2', //Main - fcfs - 10K
    // bsc: '0x62608676F04AFe23554242Cfe09cEB84A2eb4287', //Main - fcfs - 10K USDT
    // bsc: '0x1f7a0a34dFAdb7Fffd44af40e874C3bEd82430b1', //Main - fcfs - 10K - Demo
    // bsc: '0x274164619F412F6A8Aa68C80d8f95DBC2A6cC1bc', //Main - white-list - 15K - Demo
    // bsc: '0x9c7Aea41B91f936d51f3BEA446b376E9D30d6758', //Main - sqrp-gated - 5K - Demo
    // bsc: '0x566A3F53637AACc343800eCc2fE3a16A06e47704', //Main - fcfs - 10K - Demo2
    // bsc: '0x5A422c2CF95Bd3f952848442086BAf554D471b8A', //Main - sqrp-gated - 10K - Demo2
    // bsc: '0x6e622319df441962a8aff93A7Ce8Bb4E5683A87E', //Main - white-list - 10K - Demo2
    // bsc: '0x11b045028DD6bcabD740c762a889306Dcc65Daa5', //Main - white-list - 15
    // bsc: '0xEA425b1A5740c65AB3149E32d9043E0c20dd20d6', //Main - sqrp-gated - 15
    // bsc: '0x6FAd3a85e0D257183bA16F7cE31f5fDc6ac5c32c', //Main - fcfs - 15
    // bsc: '0x872D661B0840aA486f851D806A7b43aC701A660a', //Main - fcfs - 15M
    // bsc: '0xc0ad64F1FBdeCc0F5855307fcB5f3e24fbb9E543', //Main - sqrp-gated - 15M
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0x6fae03D2FbBAf8821DC3248ca61cA239f60A9Bac', //Stage - fcfs - goal: 1 USDT
    // bsc: '0x69060bc1A054a3c60d2607aAE0D403748Ad0F48c', //Stage - sqrp-gated - goal: 1 USDT
    // bsc: '0x4eB0f912ba6AbB9C1036c733D2ac0730e6C72469', //Stage - white-list - goal: 1 USDT
    // bsc: '0xFd41de115a0317Fd0Dc7F102B9f6968e99fa269b', //Stage - sqrp-gated - goal: 1 USDT - 27 Apr - 30 Apr
    // bsc: '0x44c8f558A6EE0B5935C37F6836a51CC753f9B657', //Stage - sqrp-gated - goal: 1 USDT - 1 May - 3 May
    // bsc: '0xFbAD518E930E6BBc723067D4C8aF9392FF63fE98', //Stage - fcfs - goal: 100K USDT
    // bsc: '0x02a1f14444d371C78212F208cdB84C3fab930e6E', //Stage - sqrp-gated - goal: 100K USDT
    // bsc: '0x7097F8E210452dE167C3E7F479BdEfbdB1ceF610', //Stage - sqrp-gated - goal: 1K USDT

    //24.05.2024
    // bsc: '0x723Bb34AC04e7260B3AAEDAE8CAf89B28313E4c3', //Stage - sqrp-gated - goal: 1K USDT
    // bsc: '0xe259CE655aDAE89e81641008cC3d20A86A1bAe89', //Stage - sqrp-gated - goal: 1K USDT
    // bsc: '0xf4423B4C4D1AA1e9E4623feD985292506AA5869a', //Stage - fcfs - goal: 1K USDT
    // bsc: '0xEE97B401eFD9E71d2a3b1860B8c3EB20498EF09e', //Stage - fcfs - goal: 1K USDT
    // bsc: '0xef36bCC8551C301D18FAa0C8ff092a478F39748E', //Stage - fcfs - goal: 1K USDT

    //27.05.2024
    // bsc: '0x1a97FA286546c86ee9dBEfADAC8114839F47AA79', //Stage - fcfs - goal: 1K USDT
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0x57c11ef0f8fDbdc376444DE64a03d488BD3b09B8', //Prod - fcfs - goal: 100K USDT

    //21.05.2024
    // bsc: '0x987C1768620F264074A7963AC68e60E429265Db6', //Prod - sqrp-gated - goal: 15 USDT
    // bsc: '0x97794e744c93eD38a6508c96DC743f73c89E2357', //Prod - fcfs - goal: 15 USDT

    //22.05.2024
    // bsc: '0xFf553F7283eA652e88e8F64E6556B6bb2Fcb5D7C', //Prod - sqrp-gated  - goal: 15 USDT
    // bsc: '0x4604A13bA4Aa4A61CD4E00905554aecfe31470a2', //Prod - fcfs  - goal: 24.99 USDT

    //27.05.2024
    // bsc: '0xd1A68b9c476D7fC06060E725B33F4034c2bA4c75', //Prod - sqrp-gated  - goal: 100K USDT
    // bsc: '0x4fc8DeE09D8B6F93eDA287cB7617F9f5e3A896f1', //Prod - fcfs  - goal: 100K USDT
    // bsc: '0xc595e399121A429F16Af5205b8e7BA5354eF513c', //Prod - fcfs  - goal: 28.91 USDT
    bsc: '0xDb88DE2d99249382A7cF3104A80646509f69E358', //Prod - fcfs  - goal: 15 USDT
  },
};
