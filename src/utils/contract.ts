import contracts from '../refs.json';

type NetworkName = 'mainnet' | 'testnet' | 'localterra';

interface ContractDefinition {
  codeId: string;
  address: string;
}

export interface ContractAddresses {
  'warp-controller': ContractDefinition;
  'warp-account': ContractDefinition;
}

export const CONTRACT_ADDRESSES = contracts as unknown as Record<Partial<NetworkName>, Partial<ContractAddresses>>;

export const getContractAddress = (network: string, contract: keyof ContractAddresses): string | undefined => {
  const networkName = network as NetworkName;

  if (CONTRACT_ADDRESSES[networkName]) {
    const definition = CONTRACT_ADDRESSES[networkName][contract];
    if (definition !== undefined) {
      return definition.address;
    }
  }
  return undefined;
};

export const getNetworkName = (chainId: string): NetworkName => {
  if (chainId.toLocaleLowerCase().startsWith('phoenix-')) {
    return 'mainnet';
  }
  if (chainId.toLocaleLowerCase().startsWith('pisco-')) {
    return 'testnet';
  }
  return 'localterra';
};

import { LCDClient } from '@terra-money/terra.js';

export const contractQuery = async <QueryMsg extends {}, QueryResponse>(
  lcd: LCDClient,
  contractAddress: string,
  msg: QueryMsg
): Promise<QueryResponse> => {
  return await lcd.wasm.contractQuery<QueryResponse>(contractAddress, msg);
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
