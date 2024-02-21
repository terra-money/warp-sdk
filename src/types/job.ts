import { warp_controller, warp_resolver } from './contracts';

export type Execution = {
  condition: warp_resolver.Condition;
  msgs: warp_resolver.WarpMsg[];
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
    msgs: JSON.parse(execution.msgs) as warp_resolver.WarpMsg[],
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
