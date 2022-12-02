import { CreateTxOptions, Wallet as TerraWallet } from '@terra-money/terra.js';
import { Wallet } from './base';

export class NativeWallet extends Wallet {
  private wallet: TerraWallet;

  constructor(wallet: TerraWallet) {
    super(wallet.lcd);
    this.wallet = wallet;
  }

  public async submitTx(txOpts: CreateTxOptions): Promise<string> {
    const tx = await this.wallet.createAndSignTx(txOpts);
    const txResult = await this.wallet.lcd.tx.broadcast(tx);
    return txResult.txhash;
  }
}
