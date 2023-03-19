import { warp_controller } from './types/contracts';

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
