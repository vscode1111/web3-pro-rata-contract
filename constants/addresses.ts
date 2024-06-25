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
    // bsc: '0x3721B60822603fB7B13A180BC1E3eDd5330Df827', //Test - pro-rata
    // bsc: '0x170C8Af50A7Fa0B31e5e153e1600C891F30f5532', //Test - pro-rata
    // bsc: '0xD9cb29a4eF5A08aA16ac1A497C061Dc54606D5b8', //Test - pro-rata
    // bsc: '0x070403460c1ff7cdaE96BB77F418217A524357C9', //Test - pro-rata
    // bsc: '0x6804b473f6a33Ac364FBD070548f69e32DC22bFA', //Test - pro-rata
    // bsc: '0x4ca2E22bA9aFdB1f1373f6Fde8CacA4324B2E04E', //Test - pro-rata-sqrp-gated
    // bsc: '0x5Ef6854EeA6eBdEaC4840a249df638d03ad0A426', //Test - pro-rata-sqrp-gated
    // bsc: '0x83175Ce87b2a64946419da090A2409e7753786a2', //Test - pro-rata-sqrp-gated
    // bsc: '0xF9d6f73c0bDCd0F2a7734bDCE3aFb9b9030d69F0', //Test - pro-rata-sqrp-gated
    // bsc: '0xcc0e43f876696baa27f848fe1bf2ba0df735a692', //Test - pro-rata-sqrp-gated
    // bsc: '0xC5f282e69dE080DD199Da3f7580b2A4E22cf1fEB', //Test - pro-rata-sqrp-gated
    bsc: '0x48Bb4a3Cc10f82b7EC965994d3A3Df5516F3CDF6', //Test - pro-rata-sqrp-gated
    // bsc: '0x8eb107544819B24Ed6aF22b75A3e338fb2e0DaE2', //Test - pro-rata-sqrp-gated
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0x5D27C778759e078BBe6D11A6cd802E41459Fe852', //Main - goal: 15 USDT
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0x6fae03D2FbBAf8821DC3248ca61cA239f60A9Bac', //Stage
    //12.06.2024
    // bsc: '0x58563F605b83958B59de5346f4e08C41b8766837', //Stage - pro-rata | Goal: 1 USDT
    // bsc: '0x2e0A4AE70163C0d7f15Da7d958268b4469ea44eb', //Stage - pro-rata-sqrp-gated | Goal: 1 USDT
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0xA43dcaA26C8BcCA939754408C6Cf7Fad6c071c57', //Prod - pro-rata | Goal: 12 USDT | Close: 07/30
    // bsc: '0x69DaB3a3Fde951c8FAe14587C12a8eaE10d361Ba', //Prod - pro-rata-sqrp-gated | Goal: 12 USDT | Close: 07/30
    // bsc: '0x69DaB3a3Fde951c8FAe14587C12a8eaE10d361Ba', //Prod - pro-rata-sqrp-gated | Goal: 12 USDT | Close: 07/30
  },
};
