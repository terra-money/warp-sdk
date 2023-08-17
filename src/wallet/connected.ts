import { CreateTxOptions, LCDClient, LCDClientConfig } from '@terra-money/feather.js';
import { Wallet } from './base';
import { PostResponse } from './utils';

export type ConnectedWalletInput = {
  wallet?: ConnectedWalletPayload;
  lcd: LCDClient;
};

export type ConnectedWalletPayload = {
  post: (tx: CreateTxOptions) => Promise<PostResponse>;
};

export class ConnectedWallet extends Wallet {
  private wallet?: ConnectedWalletPayload;

  constructor(input: ConnectedWalletInput, chainConfig: LCDClientConfig) {
    super(input.lcd, chainConfig);
    this.wallet = input.wallet;
  }

  public async submitTx(txOpts: CreateTxOptions): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected.');
    }

    const txResult = await this.wallet.post(txOpts);
    return txResult.txhash;
  }
}
