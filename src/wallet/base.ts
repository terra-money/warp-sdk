import { CreateTxOptions, LCDClient, TxInfo } from '@terra-money/feather.js';
import { TerraEventHandler, TerraEventKind } from '../events';
import { TerraTxError } from './utils';
import { LCDClientConfig } from '@terra-money/feather.js';

export abstract class Wallet {
  public lcd: LCDClient;
  public chainConfig: LCDClientConfig;

  constructor(lcd: LCDClient, chainConfig: LCDClientConfig) {
    this.lcd = lcd;
    this.chainConfig = chainConfig;
  }

  public abstract submitTx(txOpts: CreateTxOptions, handleEvent: TerraEventHandler): Promise<string>;

  public async finalizeTx(txHash: string): Promise<TxInfo> {
    while (true) {
      try {
        const txInfo = await this.lcd.tx.txInfo(txHash, this.chainConfig.chainID);

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
