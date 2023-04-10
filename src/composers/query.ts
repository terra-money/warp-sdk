import { warp_controller } from '../types';
import { base64encode } from '../utils';

export class QueryComposer {
  balance(address: string, denom: string): warp_controller.QueryRequestFor_String {
    return { bank: { balance: { address, denom } } };
  }

  allBalances(address: string): warp_controller.QueryRequestFor_String {
    return { bank: { all_balances: { address } } };
  }

  bondedDenom(): warp_controller.QueryRequestFor_String {
    return { staking: { bonded_denom: {} } };
  }

  allDelegations(delegator: string): warp_controller.QueryRequestFor_String {
    return { staking: { all_delegations: { delegator } } };
  }

  delegation(delegator: string, validator: string): warp_controller.QueryRequestFor_String {
    return { staking: { delegation: { delegator, validator } } };
  }

  allValidators(): warp_controller.QueryRequestFor_String {
    return { staking: { all_validators: {} } };
  }

  validator(address: string): warp_controller.QueryRequestFor_String {
    return { staking: { validator: { address } } };
  }

  stargate<T extends {}>(data: T, path: string): warp_controller.QueryRequestFor_String {
    return { stargate: { data: base64encode(data), path } };
  }

  portId(): warp_controller.QueryRequestFor_String {
    return { ibc: { port_id: {} } };
  }

  listChannels(port_id: string | null = null): warp_controller.QueryRequestFor_String {
    return { ibc: { list_channels: { port_id } } };
  }

  channel(channel_id: string, port_id: string | null = null): warp_controller.QueryRequestFor_String {
    return { ibc: { channel: { channel_id, port_id } } };
  }

  smart<T extends {}>(contract_addr: string, msg: T): warp_controller.QueryRequestFor_String {
    return { wasm: { smart: { contract_addr, msg: base64encode(msg) } } };
  }

  raw(contract_addr: string, key: warp_controller.Binary): warp_controller.QueryRequestFor_String {
    return { wasm: { raw: { contract_addr, key } } };
  }

  contractInfo(contract_addr: string): warp_controller.QueryRequestFor_String {
    return { wasm: { contract_info: { contract_addr } } };
  }

  custom(customQuery: string): warp_controller.QueryRequestFor_String {
    return { custom: customQuery };
  }
}
