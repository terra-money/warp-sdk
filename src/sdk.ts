import { LCDClient } from '@terra-money/terra.js';
import { warp_controller } from 'types/contracts';
import { every, some } from 'lodash';
import { WalletLike, Wallet, wallet } from './wallet';
import * as jsonpath from 'jsonpath';

export class WarpSdk {
  public wallet: Wallet;
  public contractAddress: string;

  constructor(walletLike: WalletLike, contractAddress: string) {
    this.wallet = wallet(walletLike);
    this.contractAddress = contractAddress;
  }

  public async jobActive(jobId: string): Promise<boolean> {
    const { job } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_job: {} }>,
      warp_controller.JobResponse
    >(this.wallet.lcd, this.contractAddress, { query_job: { id: jobId } });
    return this.resolveCond(job.condition);
  }

  public async jobs(opts: warp_controller.QueryJobsMsg = {}): Promise<warp_controller.Job[]> {
    const { jobs } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_jobs: {} }>,
      warp_controller.JobsResponse
    >(this.wallet.lcd, this.contractAddress, { query_jobs: opts });

    return jobs;
  }

  private resolveCond = async (cond: warp_controller.Condition): Promise<boolean> => {
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

  private resolveExpr = async (expr: warp_controller.Expr): Promise<boolean> => {
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

  private resolveExprTimestamp = async (expr: warp_controller.TimeExpr): Promise<boolean> => {
    const blockInfo = await this.wallet.lcd.tendermint.blockInfo();

    return this.resolveNumOp(
      Math.floor(new Date(blockInfo.block.header.time).getTime() / 1000),
      Number(expr.comparator),
      expr.op
    );
  };

  private resolveExprBlockheight = async (expr: warp_controller.BlockExpr): Promise<boolean> => {
    const blockInfo = await this.wallet.lcd.tendermint.blockInfo();

    return this.resolveNumOp(Number(blockInfo.block.header.height), Number(expr.comparator), expr.op);
  };

  private resolveExprString = async (
    expr: warp_controller.GenExprFor_ValueFor_StringAnd_StringOp
  ): Promise<boolean> => {
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

  private resolveExprNum = async (
    expr:
      | warp_controller.GenExprFor_ValueForInt128And_NumOp
      | warp_controller.GenExprFor_ValueFor_Decimal256And_NumOp
      | warp_controller.GenExprFor_ValueFor_Uint256And_NumOp
  ): Promise<boolean> => {
    if ('simple' in expr.left && 'simple' in expr.right) {
      return this.resolveNumOp(Number(expr.left.simple), Number(expr.right.simple), expr.op);
    }

    if ('query' in expr.left && 'query' in expr.right) {
      return this.resolveNumOp(
        await this.resolveQueryExprInt(expr.left.query),
        await this.resolveQueryExprInt(expr.right.query),
        expr.op
      );
    }

    if ('simple' in expr.left && 'query' in expr.right) {
      return this.resolveNumOp(Number(expr.left.simple), await this.resolveQueryExprInt(expr.right.query), expr.op);
    }

    if ('query' in expr.left && 'simple' in expr.right) {
      return this.resolveNumOp(await this.resolveQueryExprInt(expr.left.query), Number(expr.right.simple), expr.op);
    }

    return false;
  };

  private resolveQueryExprInt = async (expr: warp_controller.QueryExpr): Promise<number> => {
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

  private resolveQueryExprString = async (expr: warp_controller.QueryExpr): Promise<string> => {
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

  private resolveQueryExprBoolean = async (expr: warp_controller.QueryExpr): Promise<boolean> => {
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

  private resolveStringOp = async (left: string, right: string, op: warp_controller.StringOp): Promise<boolean> => {
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

  private resolveNumOp = async (left: number, right: number, op: warp_controller.NumOp): Promise<boolean> => {
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

const contractQuery = async <QueryMsg extends {}, QueryResponse>(
  lcd: LCDClient,
  contractAddress: string,
  msg: QueryMsg
): Promise<QueryResponse> => {
  return await lcd.wasm.contractQuery<QueryResponse>(contractAddress, msg);
};
