import refsTerra from '../refs.terra.json';
import refsInjective from '../refs.injective.json';
import { LCDClientConfig } from '@terra-money/feather.js';

export type ChainName = 'terra' | 'injective';
export type NetworkName = 'testnet' | 'mainnet';

interface ContractDefinition {
  codeId: string;
  address: string;
}

type ContractNames = 'warp-controller' | 'warp-resolver';

type NetworkConfig = {
  [contract in ContractNames]: ContractDefinition;
};

type Refs = {
  testnet: NetworkConfig;
  mainnet: NetworkConfig;
};

export type ChainMetadata = {
  name: ChainName;
  mainnet: string;
  testnet: string;
  refs: Refs;
};

export const TERRA_CHAIN: ChainMetadata = {
  name: 'terra',
  testnet: 'pisco-1',
  mainnet: 'phoenix-1',
  refs: refsTerra,
};

export const INJECTIVE_CHAIN: ChainMetadata = {
  name: 'injective',
  testnet: 'injective-888',
  mainnet: 'injective-1',
  refs: refsInjective,
};

export const SUPPORTED_CHAINS: ChainMetadata[] = [TERRA_CHAIN, INJECTIVE_CHAIN];

export interface ContractAddresses {
  controller: string;
  resolver: string;
}

export class ChainModule {
  public config: LCDClientConfig;
  public metadata: ChainMetadata;
  public contracts: ContractAddresses;

  constructor(config: LCDClientConfig) {
    this.config = config;
    this.metadata = this.chainMetadataFromChainId(this.config.chainID);

    const contractsConfig = this.contractsFromChainId(this.config.chainID);

    this.contracts = {
      controller: contractsConfig['warp-controller'].address,
      resolver: contractsConfig['warp-resolver'].address,
    };
  }

  public chainMetadata(chainName: ChainName): ChainMetadata {
    const found = SUPPORTED_CHAINS.find((chain) => chain.name === chainName);

    if (!found) {
      throw new Error(`Unsupported Chain: ${chainName}`);
    }

    return found;
  }

  public supportedChains(): ChainMetadata[] {
    return SUPPORTED_CHAINS;
  }

  public chainMetadataFromChainId(chainId: string): ChainMetadata {
    for (let chain of SUPPORTED_CHAINS) {
      if (chain.testnet === chainId || chain.mainnet === chainId) {
        return chain;
      }
    }

    throw new Error(`Unsupported Chain ID: ${chainId}`);
  }

  public networkNameFromChainId(chainId: string): NetworkName {
    const chainMetadata = this.chainMetadataFromChainId(chainId);
    return chainMetadata.testnet === chainId ? 'testnet' : 'mainnet';
  }

  public contractsFromChainId(chainId: string = this.config.chainID): NetworkConfig {
    const chainMetadata = this.chainMetadataFromChainId(chainId);
    const network = this.networkNameFromChainId(chainId);
    return chainMetadata.refs[network];
  }

  public contractAddress(contract: keyof ContractAddresses, chainId: string = this.config.chainID): string {
    const contractDefs = this.contractsFromChainId(chainId);

    switch (contract) {
      case 'controller':
        return contractDefs['warp-controller'].address;
      case 'resolver':
        return contractDefs['warp-resolver'].address;
    }
  }
}
