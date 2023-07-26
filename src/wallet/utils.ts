import { TxInfo } from '@terra-money/feather.js';

export class TerraTxError extends Error {
  txInfo: TxInfo;

  constructor(txInfo: TxInfo) {
    super(txInfo.raw_log);
    this.txInfo = txInfo;
    this.name = 'TerraTxError';
    this.toString = () => {
      return `[txhash="${this.txInfo.txhash}"]\n${JSON.stringify(this.message, null, 2)}`;
    };
  }
}

export interface TxResult {
  result?:
    | {
        height: string;
        raw_log: string;
        txhash: string;
      }
    | undefined;
  success: boolean;
}
