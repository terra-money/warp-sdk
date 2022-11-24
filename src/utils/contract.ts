import contracts from "../refs.json";

type NetworkName = "mainnet" | "testnet" | "localterra";

interface ContractDefinition {
  codeId: string;
  address: string;
}

export interface ContractAddresses {
  "warp-controller": ContractDefinition;
  "warp-account": ContractDefinition;
}

export const CONTRACT_ADDRESSES = contracts as unknown as Record<
  Partial<NetworkName>,
  Partial<ContractAddresses>
>;

export const getContractAddress = (
  network: string,
  contract: keyof ContractAddresses
): string | undefined => {
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
