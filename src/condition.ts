import { warp_controller } from './types/contracts';
import { every, some } from 'lodash';
import jsonpath from 'jsonpath';
import { contractQuery } from './utils';
import { Big } from 'big.js';
import { Wallet } from './wallet';
import { extractVariableName, resolveExternalVariable, variableName } from './variables';
import { ContractAddresses } from 'modules/chain';

export class Condition {
  public wallet: Wallet;
  public contracts: ContractAddresses;

  constructor(wallet: Wallet, contracts: ContractAddresses) {
    this.wallet = wallet;
    this.contracts = contracts;
  }

  public resolveCond = async (cond: warp_controller.Condition, vars: warp_controller.Variable[]): Promise<boolean> => {
    if ('and' in cond) {
      const all = await Promise.all(cond.and.map((c) => this.resolveCond(c, vars)));
      return every(all);
    }

    if ('or' in cond) {
      const all = await Promise.all(cond.or.map((c) => this.resolveCond(c, vars)));
      return some(all);
    }

    if ('not' in cond) {
      return !this.resolveCond(cond.not, vars);
    }

    return this.resolveExpr(cond.expr, vars);
  };

  public resolveExpr = async (expr: warp_controller.Expr, vars: warp_controller.Variable[]): Promise<boolean> => {
    if ('string' in expr) {
      return this.resolveExprString(expr.string, vars);
    }

    if ('int' in expr) {
      return this.resolveExprNum(expr.int, vars);
    }

    if ('uint' in expr) {
      return this.resolveExprNum(expr.uint, vars);
    }

    if ('decimal' in expr) {
      return this.resolveExprNum(expr.decimal, vars);
    }

    if ('timestamp' in expr) {
      return this.resolveExprTimestamp(expr.timestamp);
    }

    if ('block_height' in expr) {
      return this.resolveExprBlockheight(expr.block_height);
    }

    if ('bool' in expr) {
      return this.resolveExprBool(expr.bool, vars);
    }

    return false;
  };

  public resolveExprTimestamp = async (expr: warp_controller.TimeExpr): Promise<boolean> => {
    const blockInfo = await this.wallet.lcd.tendermint.blockInfo(this.wallet.chainConfig.chainID);

    return this.resolveNumOp(
      Big(Math.floor(new Date(blockInfo.block.header.time).getTime() / 1000)),
      Big(expr.comparator),
      expr.op
    );
  };

  public resolveExprBlockheight = async (expr: warp_controller.BlockExpr): Promise<boolean> => {
    const blockInfo = await this.wallet.lcd.tendermint.blockInfo(this.wallet.chainConfig.chainID);

    return this.resolveNumOp(Big(blockInfo.block.header.height), Big(expr.comparator), expr.op);
  };

  public resolveExprString = async (
    expr: warp_controller.GenExprFor_ValueFor_StringAnd_StringOp,
    vars: warp_controller.Variable[]
  ): Promise<boolean> => {
    const left = await this.resolveStringValue(expr.left, vars);
    const right = await this.resolveStringValue(expr.right, vars);

    return this.resolveStringOp(left, right, expr.op);
  };

  public resolveStringValue = async (
    value: warp_controller.ValueFor_String,
    vars: warp_controller.Variable[]
  ): Promise<string> => {
    if ('simple' in value) {
      return String(value.simple);
    }

    if ('ref' in value) {
      return this.resolveVariable(this.variable(value.ref, vars), (v) => String(v));
    }
  };

  public resolveExprNum = async (
    expr:
      | warp_controller.GenExprFor_NumValueForInt128And_NumExprOpAnd_IntFnOpAnd_NumOp
      | warp_controller.GenExprFor_NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOpAnd_NumOp
      | warp_controller.GenExprFor_NumValueFor_Uint256And_NumExprOpAnd_IntFnOpAnd_NumOp,
    vars: warp_controller.Variable[]
  ): Promise<boolean> => {
    const left = await this.resolveNumValue(expr.left, vars);
    const right = await this.resolveNumValue(expr.right, vars);

    return this.resolveNumOp(left, right, expr.op);
  };

  public resolveNumValue = async (
    value:
      | warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp
      | warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
      | warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp,
    vars: warp_controller.Variable[]
  ): Promise<Big> => {
    if ('simple' in value) {
      return Big(value.simple);
    }

    if ('expr' in value) {
      return this.resolveNumExpr(value.expr, vars);
    }

    if ('fn' in value) {
      return this.resolveNumFn(value.fn, vars);
    }

    if ('ref' in value) {
      return this.resolveVariable(this.variable(value.ref, vars), (v) => Big(v));
    }

    if ('env' in value) {
      const blockInfo = await this.wallet.lcd.tendermint.blockInfo(this.wallet.chainConfig.chainID);

      if (value.env === 'block_height') {
        return Big(blockInfo.block.header.height);
      }

      if (value.env === 'time') {
        return Big(Math.floor(new Date(blockInfo.block.header.time).getTime() / 1000));
      }
    }
  };

  public async resolveNumFn(
    fn:
      | warp_controller.NumFnValueForInt128And_NumExprOpAnd_IntFnOp
      | warp_controller.NumFnValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
      | warp_controller.NumFnValueFor_Uint256And_NumExprOpAnd_IntFnOp,
    vars: warp_controller.Variable[]
  ): Promise<Big> {
    const val = await this.resolveNumValue(fn.right, vars);
    switch (fn.op) {
      case 'abs':
        return val.abs();
      case 'neg':
        return val.neg();
      case 'floor':
        return val.round(0, 0);
      case 'sqrt':
        return val.sqrt();
      case 'ceil':
        return val.round(0, 1);
    }
  }

  public async resolveNumExpr(
    expr:
      | warp_controller.NumExprValueForInt128And_NumExprOpAnd_IntFnOp
      | warp_controller.NumExprValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
      | warp_controller.NumExprValueFor_Uint256And_NumExprOpAnd_IntFnOp,
    vars: warp_controller.Variable[]
  ): Promise<Big> {
    const left = await this.resolveNumValue(expr.left, vars);
    const right = await this.resolveNumValue(expr.right, vars);

    switch (expr.op) {
      case 'add':
        return left.add(right);
      case 'sub':
        return left.sub(right);
      case 'div':
        return left.div(right);
      case 'mul':
        return left.mul(right);
      case 'mod':
        return left.mod(right);
    }
  }

  public variable(ref: string, vars: warp_controller.Variable[]): warp_controller.Variable {
    const name = extractVariableName(ref);
    const v = vars.find((v) => variableName(v) === name);

    if (!v) {
      throw Error(`Unknown variable reference: ${name}.`);
    }

    return v;
  }

  public resolveExprBool(ref: string, vars: warp_controller.Variable[]): Promise<boolean> {
    const v = this.variable(ref, vars);

    return this.resolveVariable(v, (val) => Boolean(val));
  }

  public async resolveVariable<T>(variable: warp_controller.Variable, cast: (val: string) => T): Promise<T> {
    if ('static' in variable) {
      return cast(variable.static.value);
    }

    if ('external' in variable) {
      return cast(await resolveExternalVariable(variable.external));
    }

    if ('query' in variable) {
      return cast(await this.resolveQueryVariable(variable.query));
    }
  }

  public async resolveQueryVariable(query: warp_controller.QueryVariable): Promise<string> {
    const resp = await contractQuery<
      Extract<warp_controller.QueryMsg, { simulate_query: {} }>,
      warp_controller.SimulateResponse
    >(this.wallet.lcd, this.contracts.controller, { simulate_query: { query: query.init_fn.query } });
    const extracted = jsonpath.query(JSON.parse(resp.response), query.init_fn.selector);

    if (extracted[0] == null) {
      return null;
    } else {
      return String(extracted[0]);
    }
  }

  public resolveStringOp = async (left: string, right: string, op: warp_controller.StringOp): Promise<boolean> => {
    if (left == null || right == null) {
      return false;
    }

    switch (op) {
      case 'contains':
        return left.includes(right);
      case 'ends_with':
        return left.endsWith(right);
      case 'eq':
        return left === right;
      case 'neq':
        return left !== right;
      case 'starts_with':
        return left.startsWith(right);
    }
  };

  public resolveNumOp = async (left: Big, right: Big, op: warp_controller.NumOp): Promise<boolean> => {
    if (left == null || right == null) {
      return false;
    }

    switch (op) {
      case 'eq':
        return left.eq(right);
      case 'neq':
        return !left.eq(right);
      case 'gt':
        return left.gt(right);
      case 'gte':
        return left.gte(right);
      case 'lt':
        return left.lt(right);
      case 'lte':
        return left.lte(right);
    }
  };
}
