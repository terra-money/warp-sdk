import { warp_resolver } from '../types';
import { variableName } from '../variables';

export class ConditionComposer {
  public and(...conditions: warp_resolver.Condition[]): warp_resolver.Condition {
    return { and: conditions };
  }

  public or(...conditions: warp_resolver.Condition[]): warp_resolver.Condition {
    return { or: conditions };
  }

  public not(condition: warp_resolver.Condition): warp_resolver.Condition {
    return { not: condition };
  }

  public expr(expression: warp_resolver.Expr): warp_resolver.Condition {
    return { expr: expression };
  }

  public string(
    left: warp_resolver.ValueFor_String,
    op: warp_resolver.StringOp,
    right: warp_resolver.ValueFor_String
  ): warp_resolver.Condition {
    const expr: warp_resolver.GenExprFor_ValueFor_StringAnd_StringOp = { left, op, right };
    return this.expr({ string: expr });
  }

  public uint(
    left: warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp,
    op: warp_resolver.NumOp,
    right: warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp
  ): warp_resolver.Condition {
    const expr: warp_resolver.GenExprFor_NumValueFor_Uint256And_NumExprOpAnd_IntFnOpAnd_NumOp = { left, op, right };
    return this.expr({ uint: expr });
  }

  public int(
    left: warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp,
    op: warp_resolver.NumOp,
    right: warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp
  ): warp_resolver.Condition {
    const expr: warp_resolver.GenExprFor_NumValueForInt128And_NumExprOpAnd_IntFnOpAnd_NumOp = { left, op, right };
    return this.expr({ int: expr });
  }

  public decimal(
    left: warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp,
    op: warp_resolver.NumOp,
    right: warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
  ): warp_resolver.Condition {
    const expr: warp_resolver.GenExprFor_NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOpAnd_NumOp = {
      left,
      op,
      right,
    };
    return this.expr({ decimal: expr });
  }

  public timestamp(comparator: warp_resolver.Uint64, op: warp_resolver.TimeOp): warp_resolver.Condition {
    const expr: warp_resolver.TimeExpr = { comparator, op };
    return this.expr({ timestamp: expr });
  }

  public block_height(comparator: warp_resolver.Uint64, op: warp_resolver.NumOp): warp_resolver.Condition {
    const expr: warp_resolver.BlockExpr = { comparator, op };
    return this.expr({ block_height: expr });
  }

  public bool(value: warp_resolver.Variable): warp_resolver.Condition {
    return this.expr({ bool: `$warp.variable.${variableName(value)}` });
  }
}

export class UintValueComposer {
  public simple(value: string): warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp {
    return { simple: value };
  }

  public expr(
    left: warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp,
    op: warp_resolver.NumExprOp,
    right: warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp
  ): warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp {
    return { expr: { left, op, right } };
  }

  public ref(ref: warp_resolver.Variable): warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp {
    return { ref: `$warp.variable.${variableName(ref)}` };
  }

  public fn(
    op: warp_resolver.IntFnOp,
    right: warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp
  ): warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp {
    return { fn: { op, right } };
  }

  public env(env: warp_resolver.NumEnvValue): warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp {
    return { env };
  }
}

export class IntValueComposer {
  public simple(value: number): warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp {
    return { simple: value };
  }

  public expr(
    left: warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp,
    op: warp_resolver.NumExprOp,
    right: warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp
  ): warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp {
    return { expr: { left, op, right } };
  }

  public ref(ref: warp_resolver.Variable): warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp {
    return { ref: `$warp.variable.${variableName(ref)}` };
  }

  public fn(
    op: warp_resolver.IntFnOp,
    right: warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp
  ): warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp {
    return { fn: { op, right } };
  }

  public env(env: warp_resolver.NumEnvValue): warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp {
    return { env };
  }
}

export class DecimalValueComposer {
  public simple(value: string): warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
    return { simple: value };
  }

  public expr(
    left: warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp,
    op: warp_resolver.NumExprOp,
    right: warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
  ): warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
    return { expr: { left, op, right } };
  }

  public ref(ref: warp_resolver.Variable): warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
    return { ref: `$warp.variable.${variableName(ref)}` };
  }

  public fn(
    op: warp_resolver.IntFnOp,
    right: warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
  ): warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
    return { fn: { op, right } };
  }

  public env(env: warp_resolver.NumEnvValue): warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
    return { env };
  }
}

export class StringValueComposer {
  public simple(value: string): warp_resolver.ValueFor_String {
    return { simple: value };
  }

  public ref(ref: warp_resolver.Variable): warp_resolver.ValueFor_String {
    return { ref: `$warp.variable.${variableName(ref)}` };
  }
}

export class UpdateFnComposer {
  public uint(value: warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp): warp_resolver.UpdateFnValue {
    return { uint: value };
  }

  public int(value: warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp): warp_resolver.UpdateFnValue {
    return { int: value };
  }

  public decimal(value: warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp): warp_resolver.UpdateFnValue {
    return { decimal: value };
  }

  public timestamp(value: warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp): warp_resolver.UpdateFnValue {
    return { timestamp: value };
  }

  public block_height(value: warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp): warp_resolver.UpdateFnValue {
    return { block_height: value };
  }

  public bool(value: warp_resolver.Variable): warp_resolver.UpdateFnValue {
    return { bool: `$warp.variable.${variableName(value)}` };
  }
}
