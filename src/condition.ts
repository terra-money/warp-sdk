import { warp_resolver } from './types/contracts';
import { every, some } from 'lodash';
import { JSONPath } from 'jsonpath-plus';
import { base64encode, contractQuery } from './utils';
import { Big } from 'big.js';
import { Wallet } from './wallet';
import { extractVariableName, resolveExternalVariable, variableName } from './variables';
import { ContractAddresses } from 'modules/chain';
import { Job } from './types';
import { WarpSdk } from 'sdk';

export class Condition {
  public wallet: Wallet;
  public contracts: ContractAddresses;
  public sdk: WarpSdk;

  constructor(wallet: Wallet, contracts: ContractAddresses, sdk: WarpSdk) {
    this.wallet = wallet;
    this.contracts = contracts;
    this.sdk = sdk;
  }

  public resolveCond = async (cond: warp_resolver.Condition, job: Job): Promise<boolean> => {
    if ('and' in cond) {
      const all = await Promise.all(cond.and.map((c) => this.resolveCond(c, job)));
      return every(all);
    }

    if ('or' in cond) {
      const all = await Promise.all(cond.or.map((c) => this.resolveCond(c, job)));
      return some(all);
    }

    if ('not' in cond) {
      return !this.resolveCond(cond.not, job);
    }

    return this.resolveExpr(cond.expr, job);
  };

  public resolveExpr = async (expr: warp_resolver.Expr, job: Job): Promise<boolean> => {
    if ('string' in expr) {
      return this.resolveExprString(expr.string, job);
    }

    if ('int' in expr) {
      return this.resolveExprNum(expr.int, job);
    }

    if ('uint' in expr) {
      return this.resolveExprNum(expr.uint, job);
    }

    if ('decimal' in expr) {
      return this.resolveExprNum(expr.decimal, job);
    }

    if ('timestamp' in expr) {
      return this.resolveExprTimestamp(expr.timestamp);
    }

    if ('block_height' in expr) {
      return this.resolveExprBlockheight(expr.block_height);
    }

    if ('bool' in expr) {
      return this.resolveExprBool(expr.bool, job);
    }

    return false;
  };

  public resolveExprTimestamp = async (expr: warp_resolver.TimeExpr): Promise<boolean> => {
    const blockInfo = await this.wallet.lcd.tendermint.blockInfo(this.wallet.chainConfig.chainID);

    return this.resolveNumOp(
      Big(Math.floor(new Date(blockInfo.block.header.time).getTime() / 1000)),
      Big(expr.comparator),
      expr.op
    );
  };

  public resolveExprBlockheight = async (expr: warp_resolver.BlockExpr): Promise<boolean> => {
    const blockInfo = await this.wallet.lcd.tendermint.blockInfo(this.wallet.chainConfig.chainID);

    return this.resolveNumOp(Big(blockInfo.block.header.height), Big(expr.comparator), expr.op);
  };

  public resolveExprString = async (
    expr: warp_resolver.GenExprFor_StringValueFor_StringAnd_StringOp,
    job: Job
  ): Promise<boolean> => {
    const left = await this.resolveStringValue(expr.left, job);
    const right = await this.resolveStringValue(expr.right, job);

    return this.resolveStringOp(left, right, expr.op);
  };

  public resolveStringValue = async (value: warp_resolver.StringValueFor_String, job: Job): Promise<string> => {
    if ('simple' in value) {
      return String(value.simple);
    }

    if ('env' in value) {
      if (value.env === 'warp_account_addr') {
        return job.account;
      }
    }

    if ('ref' in value) {
      return this.resolveVariable(this.variable(value.ref, job), (v) => String(v));
    }
  };

  public resolveExprNum = async (
    expr:
      | warp_resolver.GenExprFor_NumValueForInt128And_NumExprOpAnd_IntFnOpAnd_NumOp
      | warp_resolver.GenExprFor_NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOpAnd_NumOp
      | warp_resolver.GenExprFor_NumValueFor_Uint256And_NumExprOpAnd_IntFnOpAnd_NumOp,
    job: Job
  ): Promise<boolean> => {
    const left = await this.resolveNumValue(expr.left, job);
    const right = await this.resolveNumValue(expr.right, job);

    return this.resolveNumOp(left, right, expr.op);
  };

  public resolveNumValue = async (
    value:
      | warp_resolver.NumValueForInt128And_NumExprOpAnd_IntFnOp
      | warp_resolver.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
      | warp_resolver.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp,
    job: Job
  ): Promise<Big> => {
    if ('simple' in value) {
      return Big(value.simple);
    }

    if ('expr' in value) {
      return this.resolveNumExpr(value.expr, job);
    }

    if ('fn' in value) {
      return this.resolveNumFn(value.fn, job);
    }

    if ('ref' in value) {
      return this.resolveVariable(this.variable(value.ref, job), (v) => Big(v));
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
      | warp_resolver.NumFnValueForInt128And_NumExprOpAnd_IntFnOp
      | warp_resolver.NumFnValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
      | warp_resolver.NumFnValueFor_Uint256And_NumExprOpAnd_IntFnOp,
    job: Job
  ): Promise<Big> {
    const val = await this.resolveNumValue(fn.right, job);
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
      | warp_resolver.NumExprValueForInt128And_NumExprOpAnd_IntFnOp
      | warp_resolver.NumExprValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
      | warp_resolver.NumExprValueFor_Uint256And_NumExprOpAnd_IntFnOp,
    job: Job
  ): Promise<Big> {
    const left = await this.resolveNumValue(expr.left, job);
    const right = await this.resolveNumValue(expr.right, job);

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

  public variable(ref: string, job: Job): warp_resolver.Variable {
    const name = extractVariableName(ref);
    const v = job.vars.find((v) => variableName(v) === name);

    if (!v) {
      throw Error(`Unknown variable reference: ${name}.`);
    }

    return v;
  }

  public resolveExprBool(ref: string, job: Job): Promise<boolean> {
    const v = this.variable(ref, job);

    return this.resolveVariable(v, (val) => Boolean(val));
  }

  public async resolveVariable<T>(variable: warp_resolver.Variable, cast: (val: string) => T): Promise<T> {
    let resp: T;
    let encode: boolean = false;

    if ('static' in variable) {
      resp = cast(variable.static.value);
      encode = variable.static.encode;
    }

    if ('external' in variable) {
      resp = cast(await resolveExternalVariable(variable.external));
      encode = variable.external.encode;
    }

    if ('query' in variable) {
      resp = cast(await this.resolveQueryVariable(variable.query));
      encode = variable.query.encode;
    }

    if (encode) {
      resp = base64encode(resp) as T;
    }

    return resp;
  }

  public async resolveQueryVariable(query: warp_resolver.QueryVariable): Promise<string> {
    const resp = await contractQuery<
      Extract<warp_resolver.QueryMsg, { simulate_query: {} }>,
      warp_resolver.SimulateResponse
    >(this.wallet.lcd, this.contracts.resolver, { simulate_query: { query: query.init_fn.query } });
    const extracted = JSONPath({ path: query.init_fn.selector, json: JSON.parse(resp.response) });

    if (extracted[0] == null) {
      return null;
    } else {
      return String(extracted[0]);
    }
  }

  public resolveStringOp = async (left: string, right: string, op: warp_resolver.StringOp): Promise<boolean> => {
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

  public resolveNumOp = async (left: Big, right: Big, op: warp_resolver.NumOp): Promise<boolean> => {
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
