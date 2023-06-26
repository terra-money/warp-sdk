import { Wallet as TerraWallet, LCDClientConfig } from '@terra-money/feather.js';
import { ConnectedWalletInput, ConnectedWallet } from './connected';
import { NativeWallet } from './native';

export type WalletLike =
  | {
      connectedWallet: ConnectedWalletInput;
    }
  | TerraWallet;

export const wallet = (walletLike: WalletLike, chainConfig: LCDClientConfig) => {
  if ('connectedWallet' in walletLike) {
    return new ConnectedWallet(walletLike.connectedWallet, chainConfig);
  }

  return new NativeWallet(walletLike, chainConfig);
};

export * from './base';
export * from './utils';
export * from './connected';
export * from './native';
