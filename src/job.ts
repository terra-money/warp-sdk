import { warp_controller } from 'types/contracts';

export class JobSequenceMsgBuilder {
  static new() {
    return new JobSequenceMsgBuilder();
  }

  sequence = [];

  chainSequence = (idx: number): warp_controller.CreateJobMsg => {
    if (this.sequence.length <= 1) {
      return this.sequence[0];
    }

    if (idx === this.sequence.length - 1) {
      return this.sequence[idx];
    }

    // chain
    const next = this.chainSequence(idx + 1);
    const curr = this.sequence[idx];

    return {
      ...curr,
      msgs: [...curr.msgs, next],
    };
  };

  chain(msg: warp_controller.CreateJobMsg): JobSequenceMsgBuilder {
    this.sequence = [...this.sequence, msg];
    return this;
  }

  build(): warp_controller.CreateJobMsg {
    return this.chainSequence(0);
  }
}

export const base64encode = (input: object): string => {
  return Buffer.from(JSON.stringify(JSON.parse(JSON.stringify(input)))).toString('base64');
};

export function base64decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64').toString()) as T;
}

export type WasmMsg = Extract<warp_controller.CosmosMsgFor_Empty, { wasm: {} }>;
export type WasmExecuteMsg = { wasm: Extract<WasmMsg['wasm'], { execute: {} }> };

export const createJobMsg = (contractAddr: string, msg: warp_controller.CreateJobMsg): WasmExecuteMsg => {
  return {
    wasm: {
      execute: {
        contract_addr: contractAddr,
        msg: base64encode(msg),
        funds: [],
      },
    },
  };
};
