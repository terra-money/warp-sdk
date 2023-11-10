import refsTerra from '../refs.terra.json';
import refsInjective from '../refs.injective.json';
import refsNeutron from '../refs.neutron.json';
import refsNibiru from '../refs.nibiru.json';
import refsMigaloo from '../refs.migaloo.json';
import { LCDClient, LCDClientConfig } from '@terra-money/feather.js';

export type ChainName = 'terra' | 'injective' | 'neutron' | 'nibiru' | 'migaloo';
export type NetworkName = 'testnet' | 'mainnet';

interface ContractDefinition {
  codeId: string;
  address: string;
}

type ContractNames = 'warp-controller' | 'warp-resolver' | 'warp-templates';

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
  mainnetConfig: LCDClientConfig;
  testnet: string;
  testnetConfig: LCDClientConfig;
  refs: Refs;
};

const mainnetConfig: Record<string, LCDClientConfig> = {
  'phoenix-1': {
    chainID: 'phoenix-1',
    lcd: 'https://phoenix-lcd.terra.dev',
    gasAdjustment: 1.75,
    gasPrices: { uluna: 0.15 },
    prefix: 'terra',
  },
  'injective-1': {
    chainID: 'injective-1',
    lcd: 'https://lcd.injective.network',
    gasAdjustment: 1.75,
    gasPrices: {
      inj: 1500000000,
    },
    prefix: 'inj',
  },
  'neutron-1': {
    chainID: 'neutron-1',
    lcd: 'https://rest-kralum.neutron-1.neutron.org',
    gasAdjustment: 1.75,
    gasPrices: {
      untrn: 0.05,
    },
    prefix: 'neutron',
  },
  'nibiru-itn-2': {
    chainID: 'nibiru-itn-2',
    lcd: 'https://lcd.itn-2.nibiru.fi',
    gasAdjustment: 1.75,
    gasPrices: {
      unibi: 0.15,
    },
    prefix: 'nibi',
  },
  'migaloo-1': {
    chainID: 'migaloo-1',
    lcd: 'https://ww-migaloo-rest.polkachu.com',
    gasAdjustment: 1.75,
    gasPrices: {
      uwhale: 1,
    },
    prefix: 'migaloo',
  },
};

const testnetConfig: Record<string, LCDClientConfig> = {
  'pisco-1': {
    lcd: 'https://pisco-lcd.terra.dev',
    chainID: 'pisco-1',
    gasAdjustment: 1.75,
    gasPrices: { uluna: 0.15 },
    prefix: 'terra',
  },
  'injective-888': {
    chainID: 'injective-888',
    lcd: 'https://k8s.testnet.lcd.injective.network',
    gasAdjustment: 1.75,
    gasPrices: {
      inj: 1500000000,
    },
    prefix: 'inj',
  },
  'pion-1': {
    chainID: 'pion-1',
    lcd: 'https://rest-palvus.pion-1.ntrn.tech',
    gasAdjustment: 1.75,
    gasPrices: {
      untrn: 0.05,
    },
    prefix: 'neutron',
  },
  'nibiru-itn-2': {
    chainID: 'nibiru-itn-2',
    lcd: 'https://lcd.itn-2.nibiru.fi',
    gasAdjustment: 1.75,
    gasPrices: {
      unibi: 0.15,
    },
    prefix: 'nibi',
  },
  'narwhal-1': {
    chainID: 'narwhal-1',
    lcd: 'https://migaloo-testnet-api.polkachu.com',
    gasAdjustment: 2,
    gasPrices: {
      uwhale: 0.015,
    },
    prefix: 'migaloo',
  },
};

export const TERRA_CHAIN: ChainMetadata = {
  name: 'terra',
  testnet: 'pisco-1',
  testnetConfig: testnetConfig['pisco-1'],
  mainnet: 'phoenix-1',
  mainnetConfig: mainnetConfig['phoenix-1'],
  refs: refsTerra,
};

export const NEUTRON_CHAIN: ChainMetadata = {
  name: 'neutron',
  testnet: 'pion-1',
  testnetConfig: testnetConfig['pion-1'],
  mainnet: 'neutron-1',
  mainnetConfig: mainnetConfig['neutron-1'],
  refs: refsNeutron,
};

export const INJECTIVE_CHAIN: ChainMetadata = {
  name: 'injective',
  testnet: 'injective-888',
  testnetConfig: testnetConfig['injective-888'],
  mainnet: 'injective-1',
  mainnetConfig: mainnetConfig['injective-1'],
  refs: refsInjective,
};

export const NIBIRU_CHAIN: ChainMetadata = {
  name: 'nibiru',
  testnet: 'nibiru-itn-2',
  testnetConfig: testnetConfig['nibiru-itn-2'],
  mainnet: 'nibiru-itn-2',
  mainnetConfig: mainnetConfig['nibiru-itn-2'],
  refs: refsNibiru,
};

export const MIGALOO_CHAIN: ChainMetadata = {
  name: 'migaloo',
  testnet: 'narwhal-1',
  testnetConfig: testnetConfig['narwhal-1'],
  mainnet: 'migaloo-1',
  mainnetConfig: mainnetConfig['migaloo-1'],
  refs: refsMigaloo,
};

export const SUPPORTED_CHAINS: ChainMetadata[] = [
  TERRA_CHAIN,
  INJECTIVE_CHAIN,
  NEUTRON_CHAIN,
  NIBIRU_CHAIN,
  MIGALOO_CHAIN,
];

export interface ContractAddresses {
  controller: string;
  resolver: string;
  templates: string;
}

export class ChainModule {
  public config: LCDClientConfig;
  public metadata: ChainMetadata;
  public contracts: ContractAddresses;

  constructor(config: LCDClientConfig) {
    this.config = config;
    this.metadata = ChainModule.chainMetadataFromChainId(this.config.chainID);

    const contractsConfig = ChainModule.contractsFromChainId(this.config.chainID);

    this.contracts = {
      controller: contractsConfig['warp-controller'].address,
      resolver: contractsConfig['warp-resolver'].address,
      templates: contractsConfig['warp-templates'].address,
    };
  }

  public static lcdClientConfig(
    networks: NetworkName[] = ['mainnet', 'testnet'],
    chains: ChainName[] = ChainModule.supportedChains().map((c) => c.name)
  ): Record<string, LCDClientConfig> {
    let configs: Record<string, LCDClientConfig> = {};

    for (const chain of chains) {
      const chainMetadata = SUPPORTED_CHAINS.find((ch) => ch.name === chain);

      if (chainMetadata) {
        for (const network of networks) {
          const config = network === 'testnet' ? chainMetadata.testnetConfig : chainMetadata.mainnetConfig;
          const configKey = config.chainID;

          configs[configKey] = config;
        }
      }
    }

    return configs;
  }

  public static lcdClient(
    input: {
      chains?: ChainName[];
      networks?: NetworkName[];
    } = {}
  ): LCDClient {
    return new LCDClient(ChainModule.lcdClientConfig(input.networks, input.chains));
  }

  public static chainMetadata(chainName: ChainName): ChainMetadata {
    const found = SUPPORTED_CHAINS.find((chain) => chain.name === chainName);

    if (!found) {
      throw new Error(`Unsupported Chain: ${chainName}`);
    }

    return found;
  }

  public static supportedChains(): ChainMetadata[] {
    return SUPPORTED_CHAINS;
  }

  public static chainMetadataFromChainId(chainId: string): ChainMetadata {
    for (let chain of SUPPORTED_CHAINS) {
      if (chain.testnet === chainId || chain.mainnet === chainId) {
        return chain;
      }
    }

    throw new Error(`Unsupported Chain ID: ${chainId}`);
  }

  public static networkNameFromChainId(chainId: string): NetworkName {
    const chainMetadata = this.chainMetadataFromChainId(chainId);
    return chainMetadata.testnet === chainId ? 'testnet' : 'mainnet';
  }

  public static contractsFromChainId(chainId: string): NetworkConfig {
    const chainMetadata = ChainModule.chainMetadataFromChainId(chainId);
    const network = ChainModule.networkNameFromChainId(chainId);
    return chainMetadata.refs[network];
  }

  public static contractAddress(contract: keyof ContractAddresses, chainId: string): string {
    const contractDefs = ChainModule.contractsFromChainId(chainId);

    switch (contract) {
      case 'controller':
        return contractDefs['warp-controller'].address;
      case 'resolver':
        return contractDefs['warp-resolver'].address;
      case 'templates':
        return contractDefs['warp-templates'].address;
    }
  }
}
