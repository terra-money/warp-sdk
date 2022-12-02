import { CreateTxOptions, LCDClient } from '@terra-money/terra.js';
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

  constructor(input: ConnectedWalletInput) {
    super(input.lcd);
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
