import { warp_account, warp_resolver } from '../types';

export class AccountComposer {
  msgs(msgs: warp_resolver.WarpMsg[]): Extract<warp_account.ExecuteMsg, { warp_msgs: {} }> {
    return {
      warp_msgs: {
        msgs,
      },
    };
  }
}
