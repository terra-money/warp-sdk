import { warp_controller } from 'types';

export class SubmitTemplateMsgBuilder {
  private _condition: warp_controller.Condition | undefined;
  private _formattedStr: string = '';
  private _kind: warp_controller.TemplateKind;
  private _msgs: warp_controller.CosmosMsgFor_Empty[] = [];
  private _name: string = '';
  private _vars: warp_controller.Variable[] = [];

  static new(): SubmitTemplateMsgBuilder {
    return new SubmitTemplateMsgBuilder();
  }

  cond(condition: warp_controller.Condition): SubmitTemplateMsgBuilder {
    this._condition = condition;
    return this;
  }

  formattedStr(formattedStr: string): SubmitTemplateMsgBuilder {
    this._formattedStr = formattedStr;
    return this;
  }

  kind(kind: warp_controller.TemplateKind): SubmitTemplateMsgBuilder {
    this._kind = kind;
    return this;
  }

  name(name: string): SubmitTemplateMsgBuilder {
    this._name = name;
    return this;
  }

  var(variable: warp_controller.Variable): SubmitTemplateMsgBuilder {
    this._vars.push(variable);
    return this;
  }

  msg(msg: warp_controller.CosmosMsgFor_Empty): SubmitTemplateMsgBuilder {
    this._msgs.push(msg);
    return this;
  }

  build(): warp_controller.SubmitTemplateMsg {
    if (!this._kind) {
      throw new Error('Kind must be provided');
    }
    if (!this._name) {
      throw new Error('Name must be provided');
    }

    const submitTemplateMsg: warp_controller.SubmitTemplateMsg = {
      condition: this._condition,
      formatted_str: this._formattedStr,
      kind: this._kind,
      msg: JSON.stringify(this._msgs),
      name: this._name,
      vars: this._vars,
    };

    return submitTemplateMsg;
  }
}
