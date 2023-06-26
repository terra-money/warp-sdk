import { CreateTxOptions, LCDClient, LCDClientConfig } from '@terra-money/feather.js';
import { Wallet } from './base';
import { TxResult } from './utils';

export type ConnectedWalletInput = {
  wallet?: ConnectedWalletPayload;
  lcd: LCDClient;
};

export type ConnectedWalletPayload = {
  post: (tx: CreateTxOptions) => Promise<TxResult>;
  availablePost: boolean;
};

export class ConnectedWallet extends Wallet {
  private wallet?: ConnectedWalletPayload;

  constructor(input: ConnectedWalletInput, chainConfig: LCDClientConfig) {
    super(input.lcd, chainConfig);
    this.wallet = input.wallet;
  }

  public async submitTx(txOpts: CreateTxOptions): Promise<string> {
    if (!this.wallet || !this.wallet.availablePost) {
      throw new Error('Wallet not connected.');
    }

    const txResult = await this.wallet.post(txOpts);
    return txResult.result.txhash;
  }
}
