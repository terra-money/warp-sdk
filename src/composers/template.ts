import { Execution, warp_resolver, warp_templates } from '../types';

export class SubmitTemplateMsgComposer {
  private _executions: Execution[] = [];
  private _formattedStr: string = '';
  private _msgs: warp_resolver.CosmosMsgFor_Empty[] = [];
  private _name: string = '';
  private _vars: warp_resolver.Variable[] = [];

  static new(): SubmitTemplateMsgComposer {
    return new SubmitTemplateMsgComposer();
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

  executions(executions: Execution[]): SubmitTemplateMsgComposer {
    this._executions = executions;
    return this;
  }

  compose(): warp_templates.SubmitTemplateMsg {
    if (this._name === undefined) {
      throw new Error('Name must be provided');
    }

    const submitTemplateMsg: warp_templates.SubmitTemplateMsg = {
      formatted_str: this._formattedStr,
      executions: this._executions.map((e) => ({
        condition: JSON.stringify(e.condition),
        msgs: JSON.stringify(e.msgs),
      })),
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
