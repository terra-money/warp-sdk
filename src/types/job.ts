import Big from 'big.js';
import { warp_controller, warp_resolver } from './contracts';

export type Execution = {
  condition: warp_resolver.Condition;
  msgs: warp_resolver.CosmosMsgFor_Empty[];
};

export type Job = Omit<warp_controller.Job, 'executions' | 'vars'> & {
  executions: Execution[];
  vars: warp_resolver.Variable[];
};

export type JobResponse = {
  job: Job;
};

export type JobsResponse = {
  total_count: number;
  jobs: Job[];
};

export const parseExecution = (execution: warp_controller.Execution): Execution => {
  return {
    msgs: JSON.parse(execution.msgs) as warp_resolver.CosmosMsgFor_Empty[],
    condition: JSON.parse(execution.condition) as warp_resolver.Condition,
  };
};

export const parseJob = (job: warp_controller.Job): Job => {
  return {
    ...job,
    vars: JSON.parse(job.vars) as warp_resolver.Variable[],
    executions: job.executions.map(parseExecution),
  };
};

export const parseJobResponse = (resp: warp_controller.JobResponse): JobResponse => {
  return {
    job: parseJob(resp.job),
  };
};

export const parseJobsResponse = (resp: warp_controller.JobsResponse): JobsResponse => {
  return {
    ...resp,
    jobs: resp.jobs.map(parseJob),
  };
};

export type Fund =
  | warp_controller.Fund
  | {
      native: {
        denom: string;
        amount: string;
      };
    };

export function mergeFunds(funds: Fund[], fund: Fund): Fund[] {
  const mergedFunds = [...funds];
  let fundMerged = false;

  for (let i = 0; i < mergedFunds.length; i++) {
    const existingFund = mergedFunds[i];

    if ('native' in fund && 'native' in existingFund) {
      if (fund.native.denom === existingFund.native.denom) {
        mergedFunds[i] = {
          native: {
            denom: fund.native.denom,
            amount: Big(existingFund.native.amount).add(fund.native.amount).toString(),
          },
        };
        fundMerged = true;
        break;
      }
    } else if ('cw20' in fund && 'cw20' in existingFund) {
      if (fund.cw20.contract_addr === existingFund.cw20.contract_addr) {
        mergedFunds[i] = {
          cw20: {
            contract_addr: fund.cw20.contract_addr,
            amount: Big(existingFund.cw20.amount).add(fund.cw20.amount).toString(),
          },
        };
        fundMerged = true;
        break;
      }
    } else if ('cw721' in fund && 'cw721' in existingFund) {
      if (
        fund.cw721.contract_addr === existingFund.cw721.contract_addr &&
        fund.cw721.token_id === existingFund.cw721.token_id
      ) {
        // cw721 tokens are non-fungible, so we don't merge them based on amount, but check for duplicates based on token_id
        fundMerged = true;
        break;
      }
    }
  }

  if (!fundMerged) {
    mergedFunds.push(fund);
  }

  return mergedFunds;
}
