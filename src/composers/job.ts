import { warp_controller, warp_resolver } from '../types/contracts';

export class JobSequenceMsgComposer {
  static new() {
    return new JobSequenceMsgComposer();
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

  chain(msg: warp_controller.CreateJobMsg): JobSequenceMsgComposer {
    this.sequence = [...this.sequence, msg];
    return this;
  }

  compose(): warp_controller.CreateJobMsg {
    return this.chainSequence(0);
  }
}

export class CreateJobMsgComposer {
  private _name: string | undefined;
  private _recurring: boolean | undefined;
  private _requeue_on_evict: boolean | undefined;
  private _reward: warp_controller.Uint128 | undefined;
  private _description: string;
  private _labels: string[];
  private _assetsToWithdraw: warp_controller.AssetInfo[] | undefined;
  private _msgs: warp_resolver.CosmosMsgFor_Empty[] = [];
  private _vars: warp_resolver.Variable[] = [];
  private _condition: warp_resolver.Condition | undefined;

  static new(): CreateJobMsgComposer {
    return new CreateJobMsgComposer();
  }

  name(name: string): CreateJobMsgComposer {
    this._name = name;
    return this;
  }

  recurring(recurring: boolean): CreateJobMsgComposer {
    this._recurring = recurring;
    return this;
  }

  requeueOnEvict(requeue_on_evict: boolean): CreateJobMsgComposer {
    this._requeue_on_evict = requeue_on_evict;
    return this;
  }

  reward(reward: warp_controller.Uint128): CreateJobMsgComposer {
    this._reward = reward;
    return this;
  }

  description(description: string): CreateJobMsgComposer {
    this._description = description;
    return this;
  }

  labels(labels: string[]): CreateJobMsgComposer {
    this._labels = labels;
    return this;
  }

  assetsToWithdraw(assetsToWithdraw: warp_controller.AssetInfo[]): CreateJobMsgComposer {
    this._assetsToWithdraw = assetsToWithdraw;
    return this;
  }

  msg(msg: warp_resolver.CosmosMsgFor_Empty): CreateJobMsgComposer {
    this._msgs.push(msg);
    return this;
  }

  cond(condition: warp_resolver.Condition): CreateJobMsgComposer {
    this._condition = condition;
    return this;
  }

  var(variable: warp_resolver.Variable): CreateJobMsgComposer {
    this._vars.push(variable);
    return this;
  }

  compose(): warp_controller.CreateJobMsg {
    if (
      this._name === undefined ||
      this._recurring === undefined ||
      this._requeue_on_evict === undefined ||
      this._reward === undefined ||
      this._description === undefined ||
      this._labels === undefined
    ) {
      throw new Error('All required fields must be provided');
    }

    if (this._condition === undefined) {
      throw new Error('Condition must be provided');
    }

    const createJobMsg: warp_controller.CreateJobMsg = {
      name: this._name,
      recurring: this._recurring,
      requeue_on_evict: this._requeue_on_evict,
      reward: this._reward,
      description: this._description,
      labels: this._labels,
      condition: JSON.stringify(this._condition),
      msgs: JSON.stringify(this._msgs),
      vars: JSON.stringify(this._vars),
      assets_to_withdraw: this._assetsToWithdraw,
    };

    return createJobMsg;
  }
}

export class JobComposer {
  create(): CreateJobMsgComposer {
    return new CreateJobMsgComposer();
  }
}
