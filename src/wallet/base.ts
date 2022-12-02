import { CreateTxOptions, LCDClient, TxInfo } from '@terra-money/terra.js';
import { TerraEventHandler, TerraEventKind } from '../events';
import { TerraTxError } from './utils';

export abstract class Wallet {
  public lcd: LCDClient;

  constructor(lcd: LCDClient) {
    this.lcd = lcd;
  }

  public abstract submitTx(txOpts: CreateTxOptions, handleEvent: TerraEventHandler): Promise<string>;

  public async finalizeTx(txHash: string): Promise<TxInfo> {
    while (true) {
      try {
        const txInfo = await this.lcd.tx.txInfo(txHash);

        if (txInfo.code !== 0) {
          throw new TerraTxError(txInfo);
        }

        return txInfo;
      } catch (err) {
        if (err instanceof TerraTxError) {
          throw err;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  public async tx(txOpts: CreateTxOptions, handleEvent: TerraEventHandler = () => {}): Promise<TxInfo> {
    const txHash = await this.submitTx(txOpts, handleEvent);
    handleEvent({ kind: TerraEventKind.TxSubmitted, payload: { txHash } });
    return this.finalizeTx(txHash);
  }
}
