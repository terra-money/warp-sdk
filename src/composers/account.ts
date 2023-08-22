import { warp_account, warp_resolver } from '../types';

type GenericMsg = Extract<warp_account.ExecuteMsg, { generic: {} }>;

export class AccountComposer {
  generic(msgs: warp_resolver.CosmosMsgFor_Empty[]): GenericMsg {
    return {
      generic: {
        msgs,
      },
    };
  }
}
