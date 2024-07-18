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
    bsc: '0x9173f867D118257A54A28662884c4C6693F8be85', //Main - 10K USDT - external refund
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '', //Stage
    //-------------------------------------------------------------------------------------------------------------
    // bsc: '', //Prod - pro-rata | Base goal: 12 USDT | Close: 07/30
  },
};
