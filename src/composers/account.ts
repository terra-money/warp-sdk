import { warp_job_account, warp_resolver } from '../types';

type GenericMsg = Extract<warp_job_account.ExecuteMsg, { generic: {} }>;

export class AccountComposer {
  generic(msgs: warp_resolver.CosmosMsgFor_Empty[]): Extract<warp_job_account.ExecuteMsg, { generic: {} }> {
    return {
      generic: {
        msgs,
      },
    };
  }

  msgs(msgs: warp_resolver.WarpMsg[]): Extract<warp_job_account.ExecuteMsg, { warp_msgs: {} }> {
    return {
      warp_msgs: {
        msgs,
      },
    };
  }
}
