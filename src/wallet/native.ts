import { CreateTxOptions, Wallet as TerraWallet, LCDClientConfig } from '@terra-money/feather.js';
import { Wallet } from './base';

export class NativeWallet extends Wallet {
  private wallet: TerraWallet;

  constructor(wallet: TerraWallet, chainConfig: LCDClientConfig) {
    super(wallet.lcd, chainConfig);
    this.wallet = wallet;
  }

  public async submitTx(txOpts: CreateTxOptions): Promise<string> {
    const tx = await this.wallet.createAndSignTx(txOpts);
    const txResult = await this.wallet.lcd.tx.broadcast(tx, this.chainConfig.chainID);
    return txResult.txhash;
  }
}
