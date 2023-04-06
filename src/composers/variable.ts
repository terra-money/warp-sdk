import { warp_controller } from '../types';

class StaticVariableComposer {
  private variable: warp_controller.StaticVariable;

  constructor() {
    this.variable = { kind: 'string', name: '', value: '' };
  }

  kind(kind: warp_controller.VariableKind): StaticVariableComposer {
    this.variable.kind = kind;
    return this;
  }

  name(name: string): StaticVariableComposer {
    this.variable.name = name;
    return this;
  }

  value(value: string): StaticVariableComposer {
    this.variable.value = value;
    return this;
  }

  onSuccess(fn: warp_controller.UpdateFnValue): StaticVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_success: fn,
    };

    return this;
  }

  onError(fn: warp_controller.UpdateFnValue): StaticVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_error: fn,
    };

    return this;
  }

  compose(): warp_controller.Variable {
    return { static: this.variable };
  }
}

class ExternalVariableComposer {
  private variable: warp_controller.ExternalVariable;

  constructor() {
    this.variable = {
      kind: 'string',
      name: '',
      reinitialize: false,
      init_fn: {} as warp_controller.ExternalExpr,
    };
  }

  kind(kind: warp_controller.VariableKind): ExternalVariableComposer {
    this.variable.kind = kind;
    return this;
  }

  name(name: string): ExternalVariableComposer {
    this.variable.name = name;
    return this;
  }

  value(value: string): ExternalVariableComposer {
    this.variable.value = value;
    return this;
  }

  reinitialize(value: boolean): ExternalVariableComposer {
    this.variable.reinitialize = value;
    return this;
  }

  onInit(value: warp_controller.ExternalExpr): ExternalVariableComposer {
    this.variable.init_fn = value;
    return this;
  }

  onSuccess(fn: warp_controller.UpdateFnValue): ExternalVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_success: fn,
    };

    return this;
  }

  onError(fn: warp_controller.UpdateFnValue): ExternalVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_error: fn,
    };

    return this;
  }

  compose(): warp_controller.Variable {
    return { external: this.variable };
  }
}

class QueryVariableComposer {
  private variable: warp_controller.QueryVariable;

  constructor() {
    this.variable = {
      kind: 'string',
      name: '',
      reinitialize: false,
      init_fn: {} as warp_controller.QueryExpr,
    };
  }

  kind(kind: warp_controller.VariableKind): QueryVariableComposer {
    this.variable.kind = kind;
    return this;
  }

  name(name: string): QueryVariableComposer {
    this.variable.name = name;
    return this;
  }

  value(value: string): QueryVariableComposer {
    this.variable.value = value;
    return this;
  }

  reinitialize(value: boolean): QueryVariableComposer {
    this.variable.reinitialize = value;
    return this;
  }

  onInit(value: warp_controller.QueryExpr): QueryVariableComposer {
    this.variable.init_fn = value;
    return this;
  }

  onSuccess(fn: warp_controller.UpdateFnValue): QueryVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_success: fn,
    };

    return this;
  }

  onError(fn: warp_controller.UpdateFnValue): QueryVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_error: fn,
    };

    return this;
  }

  compose(): warp_controller.Variable {
    return { query: this.variable };
  }
}

export class VariableComposer {
  static static(): StaticVariableComposer {
    return new StaticVariableComposer();
  }

  static external(): ExternalVariableComposer {
    return new ExternalVariableComposer();
  }

  static query(): QueryVariableComposer {
    return new QueryVariableComposer();
  }
}
