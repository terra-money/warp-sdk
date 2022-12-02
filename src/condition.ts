import { warp_controller } from 'types/contracts';
import { every, some } from 'lodash';
import * as jsonpath from 'jsonpath';
import { contractQuery } from 'utils';
import { Wallet } from 'wallet';

export class Condition {
  public wallet: Wallet;
  public contractAddress: string;

  constructor(wallet: Wallet, contractAddress: string) {
    this.wallet = wallet;
    this.contractAddress = contractAddress;
  }

  public resolveCond = async (cond: warp_controller.Condition): Promise<boolean> => {
    if ('and' in cond) {
      const all = await Promise.all(cond.and.map(this.resolveCond));
      return every(all);
    }

    if ('or' in cond) {
      const all = await Promise.all(cond.or.map(this.resolveCond));
      return some(all);
    }

    if ('not' in cond) {
      return !this.resolveCond(cond.not);
    }

    return this.resolveExpr(cond.expr);
  };

  public resolveExpr = async (expr: warp_controller.Expr): Promise<boolean> => {
    if ('string' in expr) {
      return this.resolveExprString(expr.string);
    }

    if ('int' in expr) {
      return this.resolveExprNum(expr.int);
    }

    if ('uint' in expr) {
      return this.resolveExprNum(expr.uint);
    }

    if ('decimal' in expr) {
      return this.resolveExprNum(expr.decimal);
    }

    if ('timestamp' in expr) {
      return this.resolveExprTimestamp(expr.timestamp);
    }

    if ('block_height' in expr) {
      return this.resolveExprBlockheight(expr.block_height);
    }

    if ('bool' in expr) {
      return this.resolveQueryExprBoolean(expr.bool);
    }

    return false;
  };

  public resolveExprTimestamp = async (expr: warp_controller.TimeExpr): Promise<boolean> => {
    const blockInfo = await this.wallet.lcd.tendermint.blockInfo();

    return this.resolveNumOp(
      Math.floor(new Date(blockInfo.block.header.time).getTime() / 1000),
      Number(expr.comparator),
      expr.op
    );
  };

  public resolveExprBlockheight = async (expr: warp_controller.BlockExpr): Promise<boolean> => {
    const blockInfo = await this.wallet.lcd.tendermint.blockInfo();

    return this.resolveNumOp(Number(blockInfo.block.header.height), Number(expr.comparator), expr.op);
  };

  public resolveExprString = async (expr: warp_controller.GenExprFor_ValueFor_StringAnd_StringOp): Promise<boolean> => {
    if ('simple' in expr.left && 'simple' in expr.right) {
      return this.resolveStringOp(expr.left.simple, expr.right.simple, expr.op);
    }

    if ('query' in expr.left && 'query' in expr.right) {
      return this.resolveStringOp(
        await this.resolveQueryExprString(expr.left.query),
        await this.resolveQueryExprString(expr.right.query),
        expr.op
      );
    }

    if ('simple' in expr.left && 'query' in expr.right) {
      return this.resolveStringOp(expr.left.simple, await this.resolveQueryExprString(expr.right.query), expr.op);
    }

    if ('query' in expr.left && 'simple' in expr.right) {
      return this.resolveStringOp(await this.resolveQueryExprString(expr.left.query), expr.right.simple, expr.op);
    }

    return false;
  };

  public resolveExprNum = async (
    expr:
      | warp_controller.GenExprFor_NumValueForInt128And_NumExprOpAnd_IntFnOpAnd_NumOp
      | warp_controller.GenExprFor_NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOpAnd_NumOp
      | warp_controller.GenExprFor_NumValueFor_Uint256And_NumExprOpAnd_IntFnOpAnd_NumOp
  ): Promise<boolean> => {
    const left = await this.resolveNumValue(expr.left);
    const right = await this.resolveNumValue(expr.right);

    return this.resolveNumOp(left, right, expr.op);
  };

  public resolveNumValue = async (
    value:
      | warp_controller.NumValueForInt128And_NumExprOpAnd_IntFnOp
      | warp_controller.NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
      | warp_controller.NumValueFor_Uint256And_NumExprOpAnd_IntFnOp
  ): Promise<number> => {
    if ('simple' in value) {
      return Number(value.simple);
    }

    if ('expr' in value) {
      return this.resolveNumExpr(value.expr);
    }

    if ('fn' in value) {
      return this.resolveNumFn(value.fn);
    }

    if ('query' in value) {
      return this.resolveQueryExprInt(value.query);
    }
  };

  public async resolveNumFn(
    fn:
      | warp_controller.NumFnValueForInt128And_NumExprOpAnd_IntFnOp
      | warp_controller.NumFnValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
      | warp_controller.NumFnValueFor_Uint256And_NumExprOpAnd_IntFnOp
  ): Promise<number> {
    switch (fn.op) {
      case 'abs':
        return Math.abs(await this.resolveNumValue(fn.right));
      case 'neg':
        return -1 * (await this.resolveNumValue(fn.right));
      case 'floor':
        return Math.floor(await this.resolveNumValue(fn.right));
      case 'sqrt':
        return Math.sqrt(await this.resolveNumValue(fn.right));
      case 'ceil':
        return Math.ceil(await this.resolveNumValue(fn.right));
    }
  }

  public async resolveNumExpr(
    expr:
      | warp_controller.NumExprValueForInt128And_NumExprOpAnd_IntFnOp
      | warp_controller.NumExprValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp
      | warp_controller.NumExprValueFor_Uint256And_NumExprOpAnd_IntFnOp
  ): Promise<number> {
    const left = await this.resolveNumValue(expr.left);
    const right = await this.resolveNumValue(expr.right);

    switch (expr.op) {
      case 'add':
        return left + right;
      case 'sub':
        return left - right;
      case 'div':
        return left / right;
      case 'mul':
        return left * right;
      case 'mod':
        return left % right;
    }
  }

  public resolveQueryExprInt = async (expr: warp_controller.QueryExpr): Promise<number> => {
    const resp = await contractQuery<
      Extract<warp_controller.QueryMsg, { simulate_query: {} }>,
      warp_controller.SimulateResponse
    >(this.wallet.lcd, this.contractAddress, { simulate_query: { query: expr.query } });
    const extracted = jsonpath.query(JSON.parse(resp.response), expr.selector);

    if (extracted[0] == null) {
      return null;
    } else {
      return Number(extracted[0]);
    }
  };

  public resolveQueryExprString = async (expr: warp_controller.QueryExpr): Promise<string> => {
    const resp = await contractQuery<
      Extract<warp_controller.QueryMsg, { simulate_query: {} }>,
      warp_controller.SimulateResponse
    >(this.wallet.lcd, this.contractAddress, { simulate_query: { query: expr.query } });
    const extracted = jsonpath.query(JSON.parse(resp.response), expr.selector);

    if (extracted[0] == null) {
      return null;
    } else {
      return String(extracted[0]);
    }
  };

  public resolveQueryExprBoolean = async (expr: warp_controller.QueryExpr): Promise<boolean> => {
    const resp = await contractQuery<
      Extract<warp_controller.QueryMsg, { simulate_query: {} }>,
      warp_controller.SimulateResponse
    >(this.wallet.lcd, this.contractAddress, { simulate_query: { query: expr.query } });
    const extracted = jsonpath.query(JSON.parse(resp.response), expr.selector);

    if (extracted[0] == null) {
      return false;
    } else {
      return Boolean(extracted[0]);
    }
  };

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

  public resolveNumOp = async (left: number, right: number, op: warp_controller.NumOp): Promise<boolean> => {
    if (left == null || right == null) {
      return false;
    }

    switch (op) {
      case 'eq':
        return left === right;
      case 'neq':
        return left !== right;
      case 'gt':
        return left > right;
      case 'gte':
        return left >= right;
      case 'lt':
        return left < right;
      case 'lte':
        return left <= right;
    }
  };
}
