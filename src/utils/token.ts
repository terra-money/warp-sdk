import { LCDClient } from '@terra-money/feather.js';
import { BigSource } from 'big.js';

export type TokenBase = {
  key: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  coinGeckoId?: string;
};

export type NativeToken = TokenBase & {
  type: 'native';
  denom: string;
};

export type NominalType<T extends BigSource> = { __type: T };
export type CW20Addr = string & NominalType<'CW20Addr'>;
export type CW20Token = TokenBase & {
  type: 'cw20';
  protocol: string;
  token: CW20Addr;
};

export type IBCToken = TokenBase & {
  type: 'ibc';
  path: string;
  base_denom: string;
  denom: string;
};

export type Token = NativeToken | CW20Token | IBCToken;

export const nativeTokenDenom = async (lcd: LCDClient, chainId: string): Promise<string> => {
  const stakingModuleParams = await lcd.staking.parameters(chainId);
  const mintModuleParams = await lcd.mint.parameters(chainId);

  return stakingModuleParams.bond_denom || mintModuleParams.mint_denom;
};
