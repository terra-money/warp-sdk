import { warp_controller } from 'types/contracts';
import { base64encode } from 'utils';

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

export type CreateJobMsg = Omit<warp_controller.CreateJobMsg, 'msgs'> & {
  msgs: warp_controller.CosmosMsgFor_Empty[];
};

export const jsonifyMsgs = (msg: CreateJobMsg): warp_controller.CreateJobMsg => {
  const { msgs, ...rest } = msg;

  return {
    ...rest,
    msgs: msgs.map((msg) => JSON.stringify(msg)),
  };
};
