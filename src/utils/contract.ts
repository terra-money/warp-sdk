import { LCDClient } from '@terra-money/feather.js';
import { env } from 'process';
import path from 'path';

type NetworkName = 'mainnet' | 'testnet' | 'localterra';

interface ContractDefinition {
  codeId: string;
  address: string;
}

export interface ContractAddresses {
  'warp-controller': ContractDefinition;
  'warp-account': ContractDefinition;
  'warp-resolver': ContractDefinition;
}

type Chain = 'terra' | 'neutron';

const SUPPORTED_CHAINS: Chain[] = ['terra', 'neutron'];

const getChainFromChainId = (chainId: string): Chain => {
  switch (chainId) {
    case 'pisco-1':
    case 'phoenix-1':
    case 'localterra':
      return 'terra';
    default:
      return 'terra';
  }
};

const supportedChainsRefs = SUPPORTED_CHAINS.reduce(
  (acc, c) => ({
    ...acc,
    [c]: require(path.resolve(__dirname, `../src/refs.${c.toLowerCase()}.json`)),
  }),
  {}
);

export const getContractAddress = (chainId: string, contract: keyof ContractAddresses): string | undefined => {
  const network = getNetworkName(chainId);
  const chain = getChainFromChainId(chainId);
  const networkName = network as NetworkName;

  if (supportedChainsRefs[chain][networkName]) {
    const definition = supportedChainsRefs[chain][networkName][contract];
    if (definition !== undefined) {
      return definition.address;
    }
  }

  return undefined;
};

// TODO: add mainnet and testnet for neutron
export const getNetworkName = (chainId: string): NetworkName => {
  if (chainId.toLocaleLowerCase().startsWith('phoenix-')) {
    return 'mainnet';
  }
  if (chainId.toLocaleLowerCase().startsWith('pisco-')) {
    return 'testnet';
  }
  return 'localterra';
};

export const mainChainId = (lcd: LCDClient): string => {
  return lcd.config[env.CHAIN_ID].chainID;
};

export const contractQuery = async <QueryMsg extends {}, QueryResponse>(
  lcd: LCDClient,
  contractAddress: string,
  msg: QueryMsg
): Promise<QueryResponse> => {
  return await lcd.wasm.contractQuery<QueryResponse>(contractAddress, msg);
};

export type TransferMsg = {
  transfer: {
    recipient: string;
    amount: string;
  };
};

export const base64encode = (input: object): string => {
  return Buffer.from(JSON.stringify(JSON.parse(JSON.stringify(input)))).toString('base64');
};

export function base64decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64').toString()) as T;
}
