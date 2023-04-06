import { warp_controller } from '../types';
import { variableName } from '../variables';

export class ConditionComposer {
  public and(...conditions: warp_controller.Condition[]): warp_controller.Condition {
    return { and: conditions };
  }

  public or(...conditions: warp_controller.Condition[]): warp_controller.Condition {
    return { or: conditions };
  }

  public not(condition: warp_controller.Condition): warp_controller.Condition {
    return { not: condition };
  }

  public expr(expression: warp_controller.Expr): warp_controller.Condition {
    return { expr: expression };
  }

  public string(
    left: warp_controller.ValueFor_String,
    op: warp_controller.StringOp,
    right: warp_controller.ValueFor_String
  ): warp_controller.Condition {
    const expr: warp_controller.GenExprFor_ValueFor_StringAnd_StringOp = { left, op, right };
    return this.expr({ string: expr });
  }

  public uint(
    left: warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp,
    op: warp_controller.NumOp,
    right: warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp
  ): warp_controller.Condition {
    const expr: warp_controller.GenExprFor_NumValueFor_Uint256And_NumExprOpAnd_IntFnOpAnd_NumOp = { left, op, right };
    return this.expr({ uint: expr });
  }

  public int(
    left: warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp,
    op: warp_controller.NumOp,
    right: warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp
  ): warp_controller.Condition {
    const expr: warp_controller.GenExprFor_NumValueForInt128And_NumExprOpAnd_IntFnOpAnd_NumOp = { left, op, right };
    return this.expr({ int: expr });
  }

  public decimal(
    left: warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp,
    op: warp_controller.NumOp,
    right: warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
  ): warp_controller.Condition {
    const expr: warp_controller.GenExprFor_NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOpAnd_NumOp = {
      left,
      op,
      right,
    };
    return this.expr({ decimal: expr });
  }

  public timestamp(comparator: warp_controller.Uint64, op: warp_controller.TimeOp): warp_controller.Condition {
    const expr: warp_controller.TimeExpr = { comparator, op };
    return this.expr({ timestamp: expr });
  }

  public block_height(comparator: warp_controller.Uint64, op: warp_controller.NumOp): warp_controller.Condition {
    const expr: warp_controller.BlockExpr = { comparator, op };
    return this.expr({ block_height: expr });
  }

  public bool(value: warp_controller.Variable): warp_controller.Condition {
    return this.expr({ bool: `$warp.variable.${variableName(value)}` });
  }
}

export class UintValueComposer {
  public simple(value: string): warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp {
    return { simple: value };
  }

  public expr(
    left: warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp,
    op: warp_controller.NumExprOp,
    right: warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp
  ): warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp {
    return { expr: { left, op, right } };
  }

  public ref(ref: warp_controller.Variable): warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp {
    return { ref: `$warp.variable.${variableName(ref)}` };
  }

  public fn(
    op: warp_controller.IntFnOp,
    right: warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp
  ): warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp {
    return { fn: { op, right } };
  }

  public env(env: warp_controller.NumEnvValue): warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp {
    return { env };
  }
}

export class IntValueComposer {
  public simple(value: number): warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp {
    return { simple: value };
  }

  public expr(
    left: warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp,
    op: warp_controller.NumExprOp,
    right: warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp
  ): warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp {
    return { expr: { left, op, right } };
  }

  public ref(ref: warp_controller.Variable): warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp {
    return { ref: `$warp.variable.${variableName(ref)}` };
  }

  public fn(
    op: warp_controller.IntFnOp,
    right: warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp
  ): warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp {
    return { fn: { op, right } };
  }

  public env(env: warp_controller.NumEnvValue): warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp {
    return { env };
  }
}

export class DecimalValueComposer {
  public simple(value: string): warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
    return { simple: value };
  }

  public expr(
    left: warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp,
    op: warp_controller.NumExprOp,
    right: warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
  ): warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
    return { expr: { left, op, right } };
  }

  public ref(ref: warp_controller.Variable): warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
    return { ref: `$warp.variable.${variableName(ref)}` };
  }

  public fn(
    op: warp_controller.IntFnOp,
    right: warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
  ): warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
    return { fn: { op, right } };
  }

  public env(env: warp_controller.NumEnvValue): warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
    return { env };
  }
}

export class StringValueComposer {
  public simple(value: string): warp_controller.ValueFor_String {
    return { simple: value };
  }

  public ref(ref: warp_controller.Variable): warp_controller.ValueFor_String {
    return { ref: `$warp.variable.${variableName(ref)}` };
  }
}

export class UpdateFnComposer {
  public uint(value: warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp): warp_controller.UpdateFnValue {
    return { uint: value };
  }

  public int(value: warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp): warp_controller.UpdateFnValue {
    return { int: value };
  }

  public decimal(
    value: warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
  ): warp_controller.UpdateFnValue {
    return { decimal: value };
  }

  public timestamp(value: warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp): warp_controller.UpdateFnValue {
    return { timestamp: value };
  }

  public block_height(value: warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp): warp_controller.UpdateFnValue {
    return { block_height: value };
  }

  public bool(value: warp_controller.Variable): warp_controller.UpdateFnValue {
    return { bool: `$warp.variable.${variableName(value)}` };
  }
}
