import { variableName } from '../variables';
import { warp_resolver } from '../types';

class StaticVariableComposer {
  private variable: warp_resolver.StaticVariable;

  constructor() {
    this.variable = { kind: 'string', name: '', value: '', encode: false };
  }

  kind(kind: warp_resolver.VariableKind): StaticVariableComposer {
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

  encode(value: boolean): StaticVariableComposer {
    this.variable.encode = value;
    return this;
  }

  onSuccess(fn: warp_resolver.UpdateFnValue): StaticVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_success: fn,
    };

    return this;
  }

  onError(fn: warp_resolver.UpdateFnValue): StaticVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_error: fn,
    };

    return this;
  }

  compose(): warp_resolver.Variable {
    return { static: this.variable };
  }
}

class ExternalVariableComposer {
  private variable: warp_resolver.ExternalVariable;

  constructor() {
    this.variable = {
      kind: 'string',
      name: '',
      reinitialize: false,
      init_fn: {} as warp_resolver.ExternalExpr,
      encode: false,
    };
  }

  kind(kind: warp_resolver.VariableKind): ExternalVariableComposer {
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

  encode(value: boolean): ExternalVariableComposer {
    this.variable.encode = value;
    return this;
  }

  onInit(value: warp_resolver.ExternalExpr): ExternalVariableComposer {
    this.variable.init_fn = value;
    return this;
  }

  onSuccess(fn: warp_resolver.UpdateFnValue): ExternalVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_success: fn,
    };

    return this;
  }

  onError(fn: warp_resolver.UpdateFnValue): ExternalVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_error: fn,
    };

    return this;
  }

  compose(): warp_resolver.Variable {
    return { external: this.variable };
  }
}

class QueryVariableComposer {
  private variable: warp_resolver.QueryVariable;

  constructor() {
    this.variable = {
      kind: 'string',
      name: '',
      reinitialize: false,
      init_fn: {} as warp_resolver.QueryExpr,
      encode: false,
    };
  }

  kind(kind: warp_resolver.VariableKind): QueryVariableComposer {
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

  encode(value: boolean): QueryVariableComposer {
    this.variable.encode = value;
    return this;
  }

  onInit(value: warp_resolver.QueryExpr): QueryVariableComposer {
    this.variable.init_fn = value;
    return this;
  }

  onSuccess(fn: warp_resolver.UpdateFnValue): QueryVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_success: fn,
    };

    return this;
  }

  onError(fn: warp_resolver.UpdateFnValue): QueryVariableComposer {
    this.variable.update_fn = {
      ...(this.variable.update_fn ?? {}),
      on_error: fn,
    };

    return this;
  }

  compose(): warp_resolver.Variable {
    return { query: this.variable };
  }
}

export class VariableComposer {
  static(): StaticVariableComposer {
    return new StaticVariableComposer();
  }

  external(): ExternalVariableComposer {
    return new ExternalVariableComposer();
  }

  query(): QueryVariableComposer {
    return new QueryVariableComposer();
  }

  ref(v: warp_resolver.Variable): string {
    return `$warp.variable.${variableName(v)}`;
  }
}
