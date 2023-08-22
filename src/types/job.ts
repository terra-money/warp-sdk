import { warp_controller, warp_resolver } from './contracts';

export type Job = Omit<warp_controller.Job, 'vars' | 'condition' | 'msgs'> & {
  vars: warp_resolver.Variable[];
  condition: warp_resolver.Condition;
  msgs: warp_resolver.CosmosMsgFor_Empty[];
};

export type JobResponse = {
  job: Job;
};

export type JobsResponse = {
  total_count: number;
  jobs: Job[];
};

export const parseJob = (job: warp_controller.Job): Job => {
  return {
    ...job,
    vars: JSON.parse(job.vars) as warp_resolver.Variable[],
    condition: JSON.parse(job.condition) as warp_resolver.Condition,
    msgs: JSON.parse(job.msgs) as warp_resolver.CosmosMsgFor_Empty[],
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
