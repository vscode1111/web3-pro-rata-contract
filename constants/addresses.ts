import { DeployNetworks } from '~types';

export const WEB3_P_PRO_RATA_NAME = 'WEB3ProRata';
export const ERC20_TOKEN_NAME = 'ERC20Token';

export const MATAN_WALLET = '0xA8B8455ad9a1FAb1d4a3B69eD30A52fBA82549Bb';

export enum CONTRACT_LIST {
  WEB3_P_PRO_RATA = 'WEB3_P_PRO_RATA',
}

export const CONTRACTS: Record<CONTRACT_LIST, DeployNetworks> = {
  WEB3_P_PRO_RATA: {
    // bsc: '0x020DFF89FF74f58731A1909942E402e46a82AE06', //Test
    // bsc: '0x810C026DCD486482589661306b25eDeF7F4216E9', //Test
    // bsc: '0x7Bb240378255E38cE8882Ce7B2661a446AD8b3B7', //Test
    // bsc: '0x47c2D03fFB3139fa8CD12deF325A9D374b0a5f58', //Test
    // bsc: '0xd4533381d780905D24DAF0f7b8D43e58A74CDD57', //Main - Base goal: 10К USDT
    // bsc: '0xC81B0692cc5c4664a5aDaBc1395257B07E3aE84E', //Main - Base goal: 10К USDT
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0x491F8F96C7ab36df65C092917566eA87cAFf1757', //Main - Base goal: 10К USDT
    // bsc: '0x06951b4a5e034f8bF83407Bd35f60AA4a4A53eE5', //Main - Base goal: 10К USDT
    // bsc: '0x68422027c92812A97c39DAfAb1a00dC79a768462', //Main - Base goal: 10К USDT
    // bsc: '0xc800416AaBE20B6C7438ADb09c8E97Cd7c99F3e5', //Main - Base goal: 10К USDT
    // bsc: '0xc1Db333579ff140cE999FB9b007c50766FDC4dc7', //Main - Base goal: 10К USDT - finished
    // bsc: '0xDfa41f295c17F0FE583a4ADAe0f43E78ff20386E', //Main - Base goal: 10К USDT - finished
    // bsc: '0x8B5c0b1b6aEA174c56ec0D4f02207DA0AAfcAA63', //Main - Base goal: 10К USDT
    // bsc: '0x63a09eBf433B63b8f58d7f19148a391D6b248E9F', //Main - Base goal: 10К USDT
    // bsc: '0xafa705d74e57f0ccfc58945ae245146aee504ccc', //Main - Fedor
    // bsc: '0xcb40d75efe2aa43664773c0620955694096e41d7', //Main - Fedor
    // bsc: '0x7136747eFBCb59117cB0785efA04D874755B4aD7', //Main - 10K USDT - external refund
    // bsc: '0xD3E849e143842E047495173B5190C581F005891D', //Main - 10K USDT - external refund
    // bsc: '0x9173f867D118257A54A28662884c4C6693F8be85', //Main - 10K USDT - external refund
    // bsc: '0x741046cC8f0F680e716d99D1206DCF170FE9B5C2', //Main - 10K USDT - external refund
    // bsc: '0xe103aD53758A14026953806b7A19a88BBb3310A8', //Main - 10K USDT - external refund
    // bsc: '0x9fE6E5093F76b891e5C2dEd5DEB01CB77EF602b7', //Main - 10K USDT - external refund
    // bsc: '0xe436ae2f598219F739e15312B3fADfb473B091dF', //Main - 10K USDT
    // bsc: '0x023F33734716d8E9AAB67d49877a019e4a31FEb8', //Main - 10K USDT
    // bsc: '0xb65dBDB9Db11bbD7bC06d479d6C13386590aDB85', //Main - 10K USDT
    // bsc: '0x0fF86A4E78D8c4D522a1a9c0F9BA33168427E5F3', //Main - 10K USDT
    // bsc: '0x2FDC21d95f44fb35C18F4C3d4e1b63ecb575c7bC', //Main - 10K USDT
    // bsc: '0x7A4E5f5Cc9fa62AfeE7E2770939398660526CAb9', //Main - 10K USDT
    // bsc: '0xC6026b0ce75E6C0BECaD220D9620e119b3f9B025', //Main - 10K USDT
    // bsc: '0xe0B0B3da8Fc514BA3125B1A6f8bad108c55f5F43', //Main - 10K USDT
    // bsc: '0xD6AC27b60810C10dB1f037dd6b9Be7422582292F', //Main - 10K USDT
    // bsc: '0x35B86Ed8428e2D704651133603c95D70e2697e11', //Main - 10K USDT - linear
    // bsc: '0x316e978b5c3d23A166b7cd16ef1a6bC6840B9b68', //Main - 10K USDT - linear
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0xc2c20E329bbd80b5006d5a2Aa01b51B2c63ef307', //Stage
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '0xD9eF052d04b6FF606A3Cb89Af86C8D0f61Ff14e7', //Prod - pro-rata | Base goal: 50K USDT
    // bsc: '0x1dA402bD37B479676CbaEAfAD52659eE3Db0F85A', //Prod - pro-rata | Base goal: 5 USDT - test
    // bsc: '0xa0FDE46DeF62854FBEb5b0707ccA61c2f65f61fb', //Prod - pro-rata | Base goal: 5 USDT - test on upgrade
    // bsc: '0x4fD039Af1b10Db76E22eab106c6CeF65294883a1', //Prod - pro-rata | Base goal: 5 USDT - Fedor - problem
    // bsc: '0xF451E1f88C3EC2f14c2cA2a127548cA9E7a4a0A3', //Prod - pro-rata | Base goal: 5 USDT - test

    //06.08.2024 - Fanton
    bsc: '0x8321E7CFd146B9cbbC02a45bb8f52D43A785880e', //Prod - pro-rata | Base goal: 5 USDT - test
  },
};
