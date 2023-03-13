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
export const LUNA: NativeToken = {
  key: 'uluna',
  type: 'native',
  denom: 'uluna',
  name: 'LUNA',
  symbol: 'LUNA',
  decimals: 6,
  icon: 'https://assets.terra.money/icon/svg/LUNA.png',
  coinGeckoId: 'terra-luna-2',
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
