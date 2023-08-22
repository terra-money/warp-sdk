import { warp_resolver, warp_templates } from '../types';

export class SubmitTemplateMsgComposer {
  private _condition: warp_resolver.Condition | undefined;
  private _formattedStr: string = '';
  private _msgs: warp_resolver.CosmosMsgFor_Empty[] = [];
  private _name: string = '';
  private _vars: warp_resolver.Variable[] = [];

  static new(): SubmitTemplateMsgComposer {
    return new SubmitTemplateMsgComposer();
  }

  cond(condition: warp_resolver.Condition): SubmitTemplateMsgComposer {
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

  var(variable: warp_resolver.Variable): SubmitTemplateMsgComposer {
    this._vars.push(variable);
    return this;
  }

  msg(msg: warp_resolver.CosmosMsgFor_Empty): SubmitTemplateMsgComposer {
    this._msgs.push(msg);
    return this;
  }

  compose(): warp_templates.SubmitTemplateMsg {
    if (this._name === undefined) {
      throw new Error('Name must be provided');
    }

    const submitTemplateMsg: warp_templates.SubmitTemplateMsg = {
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
