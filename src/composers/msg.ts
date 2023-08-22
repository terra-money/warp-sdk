import { warp_resolver } from '../types';
import { base64encode } from '../utils';

export class MessageComposer {
  send(amount: warp_resolver.Coin[], to_address: string): warp_resolver.CosmosMsgFor_Empty {
    return { bank: { send: { amount, to_address } } };
  }

  burn(amount: warp_resolver.Coin[]): warp_resolver.CosmosMsgFor_Empty {
    return { bank: { burn: { amount } } };
  }

  delegate(amount: warp_resolver.Coin, validator: string): warp_resolver.CosmosMsgFor_Empty {
    return { staking: { delegate: { amount, validator } } };
  }

  undelegate(amount: warp_resolver.Coin, validator: string): warp_resolver.CosmosMsgFor_Empty {
    return { staking: { undelegate: { amount, validator } } };
  }

  redelegate(
    amount: warp_resolver.Coin,
    dst_validator: string,
    src_validator: string
  ): warp_resolver.CosmosMsgFor_Empty {
    return { staking: { redelegate: { amount, dst_validator, src_validator } } };
  }

  setWithdrawAddress(address: string): warp_resolver.CosmosMsgFor_Empty {
    return { distribution: { set_withdraw_address: { address } } };
  }

  withdrawDelegatorReward(validator: string): warp_resolver.CosmosMsgFor_Empty {
    return { distribution: { withdraw_delegator_reward: { validator } } };
  }

  transfer(
    amount: warp_resolver.Coin,
    channel_id: string,
    timeout: warp_resolver.IbcTimeout,
    to_address: string
  ): warp_resolver.CosmosMsgFor_Empty {
    return { ibc: { transfer: { amount, channel_id, timeout, to_address } } };
  }

  sendPacket<T extends {}>(
    channel_id: string,
    data: T,
    timeout: warp_resolver.IbcTimeout
  ): warp_resolver.CosmosMsgFor_Empty {
    return { ibc: { send_packet: { channel_id, data: base64encode(data), timeout } } };
  }

  closeChannel(channel_id: string): warp_resolver.CosmosMsgFor_Empty {
    return { ibc: { close_channel: { channel_id } } };
  }

  execute<T extends {}>(
    contract_addr: string,
    msg: T,
    funds: warp_resolver.Coin[] = []
  ): warp_resolver.CosmosMsgFor_Empty {
    return { wasm: { execute: { contract_addr, funds, msg: base64encode(msg) } } };
  }

  instantiate<T extends {}>(
    admin: string | null,
    code_id: number,
    label: string,
    msg: T,
    funds: warp_resolver.Coin[] = []
  ): warp_resolver.CosmosMsgFor_Empty {
    return { wasm: { instantiate: { admin, code_id, funds, label, msg: base64encode(msg) } } };
  }

  migrate<T extends {}>(contract_addr: string, msg: T, new_code_id: number): warp_resolver.CosmosMsgFor_Empty {
    return { wasm: { migrate: { contract_addr, msg: base64encode(msg), new_code_id } } };
  }

  update_admin(admin: string, contract_addr: string): warp_resolver.CosmosMsgFor_Empty {
    return { wasm: { update_admin: { admin, contract_addr } } };
  }

  clear_admin(contract_addr: string): warp_resolver.CosmosMsgFor_Empty {
    return { wasm: { clear_admin: { contract_addr } } };
  }

  vote(proposal_id: number, vote: warp_resolver.VoteOption): warp_resolver.CosmosMsgFor_Empty {
    return { gov: { vote: { proposal_id, vote } } };
  }
}
