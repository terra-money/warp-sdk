import { LCDClient } from '@terra-money/feather.js';
import { env } from 'process';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

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

const contracts = require(path.resolve(__dirname, `../src/refs.${env.CHAIN_NAME.toLowerCase()}.json`));

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
