import { warp_resolver } from '../types';
import {
  MsgSend,
  MsgDelegate,
  MsgUndelegate,
  MsgBeginRedelegate,
  MsgSetWithdrawAddress,
  MsgWithdrawDelegatorReward,
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgMigrateContract,
  MsgUpdateContractAdmin,
  MsgClearContractAdmin,
  MsgVote,
  Coin,
  Msg,
} from '@terra-money/feather.js';
import { base64decode } from './contract';
import { VoteOption } from 'tx';

export function cosmosMsgToCreateTxMsg(sender: string, input: warp_resolver.CosmosMsgFor_Empty): Msg {
  if ('bank' in input) {
    const bankMsg = input.bank;

    if ('send' in bankMsg) {
      return new MsgSend(sender, bankMsg.send.to_address, coins(bankMsg.send.amount));
    }
  } else if ('staking' in input) {
    const stakingMsg = input.staking;

    if ('delegate' in stakingMsg) {
      return new MsgDelegate(sender, stakingMsg.delegate.validator, coin(stakingMsg.delegate.amount));
    } else if ('undelegate' in stakingMsg) {
      return new MsgUndelegate(sender, stakingMsg.undelegate.validator, coin(stakingMsg.undelegate.amount));
    } else if ('redelegate' in stakingMsg) {
      return new MsgBeginRedelegate(
        sender,
        stakingMsg.redelegate.src_validator,
        stakingMsg.redelegate.dst_validator,
        coin(stakingMsg.redelegate.amount)
      );
    }
  } else if ('distribution' in input) {
    const distributionMsg = input.distribution;

    if ('set_withdraw_address' in distributionMsg) {
      return new MsgSetWithdrawAddress(sender, distributionMsg.set_withdraw_address.address);
    } else if ('withdraw_delegator_reward' in distributionMsg) {
      return new MsgWithdrawDelegatorReward(sender, distributionMsg.withdraw_delegator_reward.validator);
    }
  } else if ('wasm' in input) {
    const wasmMsg = input.wasm;

    if ('execute' in wasmMsg) {
      return new MsgExecuteContract(
        sender,
        wasmMsg.execute.contract_addr,
        base64decode(wasmMsg.execute.msg),
        coins(wasmMsg.execute.funds)
      );
    } else if ('instantiate' in wasmMsg) {
      return new MsgInstantiateContract(
        sender,
        wasmMsg.instantiate.admin,
        wasmMsg.instantiate.code_id,
        base64decode(wasmMsg.instantiate.msg),
        coins(wasmMsg.instantiate.funds),
        wasmMsg.instantiate.label
      );
    } else if ('migrate' in wasmMsg) {
      return new MsgMigrateContract(
        sender,
        wasmMsg.migrate.contract_addr,
        wasmMsg.migrate.new_code_id,
        base64decode(wasmMsg.migrate.msg)
      );
    } else if ('update_admin' in wasmMsg) {
      return new MsgUpdateContractAdmin(sender, wasmMsg.update_admin.admin, wasmMsg.update_admin.contract_addr);
    } else if ('clear_admin' in wasmMsg) {
      return new MsgClearContractAdmin(sender, wasmMsg.clear_admin.contract_addr);
    }
  } else if ('gov' in input) {
    const govMsg = input.gov;

    if ('vote' in govMsg) {
      return new MsgVote(govMsg.vote.proposal_id, sender, vote(govMsg.vote.vote));
    }
  }

  throw new Error('Estimate fee not supported for message type provided as input.');
}

function coins(input: warp_resolver.Coin[]) {
  return input.map(coin);
}

function coin(input: warp_resolver.Coin) {
  return new Coin(input.denom, input.amount);
}

function vote(input: warp_resolver.VoteOption): VoteOption {
  switch (input) {
    case 'yes':
      return VoteOption.VOTE_OPTION_YES;
    case 'abstain':
      return VoteOption.VOTE_OPTION_ABSTAIN;
    case 'no':
      return VoteOption.VOTE_OPTION_NO;
    case 'no_with_veto':
      return VoteOption.VOTE_OPTION_NO_WITH_VETO;
    default:
      throw new Error('Invalid vote option string');
  }
}
