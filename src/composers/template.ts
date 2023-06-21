import { warp_controller, warp_resolver } from '../types';

export class SubmitTemplateMsgComposer {
  private _condition: warp_controller.Condition | undefined;
  private _formattedStr: string = '';
  private _msgs: warp_controller.CosmosMsgFor_Empty[] = [];
  private _name: string = '';
  private _vars: warp_controller.Variable[] = [];

  static new(): SubmitTemplateMsgComposer {
    return new SubmitTemplateMsgComposer();
  }

  cond(condition: warp_controller.Condition): SubmitTemplateMsgComposer {
    this._condition = condition;
    return this;
  }

  formattedStr(formattedStr: string): SubmitTemplateMsgComposer {
    this._formattedStr = formattedStr;
    return this;
  }

  name(name: string): SubmitTemplateMsgComposer {
    this._name = name;
    return this;
  }

  var(variable: warp_controller.Variable): SubmitTemplateMsgComposer {
    this._vars.push(variable);
    return this;
  }

  msg(msg: warp_controller.CosmosMsgFor_Empty): SubmitTemplateMsgComposer {
    this._msgs.push(msg);
    return this;
  }

  compose(): warp_resolver.SubmitTemplateMsg {
    if (this._name === undefined) {
      throw new Error('Name must be provided');
    }

    const submitTemplateMsg: warp_resolver.SubmitTemplateMsg = {
      condition: this._condition,
      formatted_str: this._formattedStr,
      msg: JSON.stringify(this._msgs),
      name: this._name,
      vars: this._vars,
    };

    return submitTemplateMsg;
  }
}

export class TemplateComposer {
  submit(): SubmitTemplateMsgComposer {
    return new SubmitTemplateMsgComposer();
  }
}
