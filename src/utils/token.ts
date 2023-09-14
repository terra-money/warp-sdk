import { LCDClient } from '@terra-money/feather.js';
import { AxiosRequestConfig } from 'axios';
import { BigSource } from 'big.js';
import { ChainModule } from 'modules';
import { http } from './http';

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

type Explorer = {
  address: string;
  tx: string;
  validator: string;
  block: string;
};

type Channels = {
  [key: string]: string;
};

type GasPrices = {
  [key: string]: number;
};

type Network = {
  chainID: string;
  lcd: string;
  gasAdjustment: number;
  gasPrices: GasPrices;
  prefix: string;
  coinType: string;
  baseAsset: string;
  name: string;
  icon: string;
  explorer: Explorer;
  channels?: Channels;
  isClassic?: boolean;
  version?: string;
  disabledModules?: string[];
  alliance?: boolean;
  icsChannels?: any;
};

type NetworkCategory = {
  [key: string]: Network;
};

type ChainsResponse = {
  classic: NetworkCategory;
  localterra: NetworkCategory;
  mainnet: NetworkCategory;
  testnet: NetworkCategory;
};

export const nativeTokenDenom = async (lcd: LCDClient, chainId: string): Promise<string> => {
  const options: AxiosRequestConfig = {
    method: 'GET',
    url: 'https://station-assets.terra.money/chains.json',
    headers: {
      'Accept-Encoding': 'identity',
    },
  };

  const { data: chains } = await http.request<ChainsResponse>({ ...options, responseType: 'json' });

  const denom = chains[ChainModule.networkNameFromChainId(chainId)][chainId].baseAsset;

  return denom;
};
