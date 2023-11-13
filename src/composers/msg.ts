import { isVariableRef } from '../variables';
import { warp_resolver } from '../types';
import { base64encode } from '../utils';

export class MessageComposer {
  send(amount: warp_resolver.Coin[], to_address: string): warp_resolver.WarpMsg {
    return { generic: { bank: { send: { amount, to_address } } } };
  }

  burn(amount: warp_resolver.Coin[]): warp_resolver.WarpMsg {
    return { generic: { bank: { burn: { amount } } } };
  }

  delegate(amount: warp_resolver.Coin, validator: string): warp_resolver.WarpMsg {
    return { generic: { staking: { delegate: { amount, validator } } } };
  }

  undelegate(amount: warp_resolver.Coin, validator: string): warp_resolver.WarpMsg {
    return { generic: { staking: { undelegate: { amount, validator } } } };
  }

  redelegate(amount: warp_resolver.Coin, dst_validator: string, src_validator: string): warp_resolver.WarpMsg {
    return { generic: { staking: { redelegate: { amount, dst_validator, src_validator } } } };
  }

  setWithdrawAddress(address: string): warp_resolver.WarpMsg {
    return { generic: { distribution: { set_withdraw_address: { address } } } };
  }

  withdrawDelegatorReward(validator: string): warp_resolver.WarpMsg {
    return { generic: { distribution: { withdraw_delegator_reward: { validator } } } };
  }

  transfer(
    amount: warp_resolver.Coin,
    channel_id: string,
    timeout: warp_resolver.IbcTimeout,
    to_address: string
  ): warp_resolver.WarpMsg {
    return { generic: { ibc: { transfer: { amount, channel_id, timeout, to_address } } } };
  }

  sendPacket<T>(channel_id: string, data: T, timeout: warp_resolver.IbcTimeout): warp_resolver.WarpMsg {
    return {
      generic: {
        ibc: { send_packet: { channel_id, data: variableRefOrEncode(data), timeout } },
      },
    };
  }

  closeChannel(channel_id: string): warp_resolver.WarpMsg {
    return { generic: { ibc: { close_channel: { channel_id } } } };
  }

  execute<T>(contract_addr: string, msg: T, funds: warp_resolver.Coin[] = []): warp_resolver.WarpMsg {
    return {
      generic: {
        wasm: { execute: { contract_addr, funds, msg: variableRefOrEncode(msg) } },
      },
    };
  }

  instantiate<T>(
    admin: string | null,
    code_id: number,
    label: string,
    msg: T,
    funds: warp_resolver.Coin[] = []
  ): warp_resolver.WarpMsg {
    return { generic: { wasm: { instantiate: { admin, code_id, funds, label, msg: variableRefOrEncode(msg) } } } };
  }

  migrate<T>(contract_addr: string, msg: T, new_code_id: number): warp_resolver.WarpMsg {
    return { generic: { wasm: { migrate: { contract_addr, msg: variableRefOrEncode(msg), new_code_id } } } };
  }

  update_admin(admin: string, contract_addr: string): warp_resolver.WarpMsg {
    return { generic: { wasm: { update_admin: { admin, contract_addr } } } };
  }

  clear_admin(contract_addr: string): warp_resolver.WarpMsg {
    return { generic: { wasm: { clear_admin: { contract_addr } } } };
  }

  vote(proposal_id: number, vote: warp_resolver.VoteOption): warp_resolver.WarpMsg {
    return { generic: { gov: { vote: { proposal_id, vote } } } };
  }

  withdrawAssets(msg: warp_resolver.WithdrawAssetsMsg): warp_resolver.WarpMsg {
    return {
      withdraw_assets: msg,
    };
  }

  ibcTransfer(msg: warp_resolver.IbcTransferMsg): warp_resolver.WarpMsg {
    return {
      ibc_transfer: msg,
    };
  }
}

function variableRefOrEncode(input: any): string {
  return isVariableRef(input) ? input : base64encode(input);
}
