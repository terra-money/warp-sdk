export module warp_account {
  export type Addr = string;
  export interface AccountResponse {
    account: Account;
  }
  export interface Account {
    account: Addr;
    owner: Addr;
  }
  export interface AccountsResponse {
    accounts: Account[];
  }
  export interface Config {
    owner: Addr;
    warp_addr: Addr;
  }
  export type ExecuteMsg =
    | {
        generic: GenericMsg;
      }
    | {
        withdraw_assets: WithdrawAssetsMsg;
      };
  export type CosmosMsgFor_Empty =
    | {
        bank: BankMsg;
      }
    | {
        custom: Empty;
      }
    | {
        staking: StakingMsg;
      }
    | {
        distribution: DistributionMsg;
      }
    | {
        stargate: {
          type_url: string;
          value: Binary;
        };
      }
    | {
        ibc: IbcMsg;
      }
    | {
        wasm: WasmMsg;
      }
    | {
        gov: GovMsg;
      };
  export type BankMsg =
    | {
        send: {
          amount: Coin[];
          to_address: string;
        };
      }
    | {
        burn: {
          amount: Coin[];
        };
      };
  export type Uint128 = string;
  export type StakingMsg =
    | {
        delegate: {
          amount: Coin;
          validator: string;
        };
      }
    | {
        undelegate: {
          amount: Coin;
          validator: string;
        };
      }
    | {
        redelegate: {
          amount: Coin;
          dst_validator: string;
          src_validator: string;
        };
      };
  export type DistributionMsg =
    | {
        set_withdraw_address: {
          /**
           * The `withdraw_address`
           */
          address: string;
        };
      }
    | {
        withdraw_delegator_reward: {
          /**
           * The `validator_address`
           */
          validator: string;
        };
      };
  export type Binary = string;
  export type IbcMsg =
    | {
        transfer: {
          /**
           * packet data only supports one coin https://github.com/cosmos/cosmos-sdk/blob/v0.40.0/proto/ibc/applications/transfer/v1/transfer.proto#L11-L20
           */
          amount: Coin;
          /**
           * exisiting channel to send the tokens over
           */
          channel_id: string;
          /**
           * when packet times out, measured on remote chain
           */
          timeout: IbcTimeout;
          /**
           * address on the remote chain to receive these tokens
           */
          to_address: string;
        };
      }
    | {
        send_packet: {
          channel_id: string;
          data: Binary;
          /**
           * when packet times out, measured on remote chain
           */
          timeout: IbcTimeout;
        };
      }
    | {
        close_channel: {
          channel_id: string;
        };
      };
  export type Timestamp = Uint64;
  export type Uint64 = string;
  export type WasmMsg =
    | {
        execute: {
          contract_addr: string;
          funds: Coin[];
          /**
           * msg is the json-encoded ExecuteMsg struct (as raw Binary)
           */
          msg: Binary;
        };
      }
    | {
        instantiate: {
          admin?: string | null;
          code_id: number;
          funds: Coin[];
          /**
           * A human-readbale label for the contract
           */
          label: string;
          /**
           * msg is the JSON-encoded InstantiateMsg struct (as raw Binary)
           */
          msg: Binary;
        };
      }
    | {
        migrate: {
          contract_addr: string;
          /**
           * msg is the json-encoded MigrateMsg struct that will be passed to the new code
           */
          msg: Binary;
          /**
           * the code_id of the new logic to place in the given contract
           */
          new_code_id: number;
        };
      }
    | {
        update_admin: {
          admin: string;
          contract_addr: string;
        };
      }
    | {
        clear_admin: {
          contract_addr: string;
        };
      };
  export type GovMsg = {
    vote: {
      proposal_id: number;
      /**
       * The vote option.
       *
       * This should be called "option" for consistency with Cosmos SDK. Sorry for that. See <https://github.com/CosmWasm/cosmwasm/issues/1571>.
       */
      vote: VoteOption;
    };
  };
  export type VoteOption = 'yes' | 'no' | 'abstain' | 'no_with_veto';
  export type AssetInfo =
    | {
        native: string;
      }
    | {
        cw20: Addr;
      }
    | {
        /**
         * @minItems 2
         * @maxItems 2
         */
        cw721: [Addr, string];
      };
  export interface GenericMsg {
    msgs: CosmosMsgFor_Empty[];
  }
  export interface Coin {
    amount: Uint128;
    denom: string;
  }
  export interface Empty {}
  export interface IbcTimeout {
    block?: IbcTimeoutBlock | null;
    timestamp?: Timestamp | null;
  }
  export interface IbcTimeoutBlock {
    /**
     * block height after which the packet times out. the height within the given revision
     */
    height: number;
    /**
     * the version that the client is currently on (eg. after reseting the chain this could increment 1 as height drops to 0)
     */
    revision: number;
  }
  export interface WithdrawAssetsMsg {
    asset_infos: AssetInfo[];
  }
  export type Fund =
    | {
        cw20: Cw20Fund;
      }
    | {
        cw721: Cw721Fund;
      };
  export interface InstantiateMsg {
    funds?: Fund[] | null;
    owner: string;
  }
  export interface Cw20Fund {
    amount: Uint128;
    contract_addr: string;
  }
  export interface Cw721Fund {
    contract_addr: string;
    token_id: string;
  }
  export type JobStatus = 'Pending' | 'Executed' | 'Failed' | 'Cancelled' | 'Evicted';
  export interface JobResponse {
    job: Job;
  }
  export interface Job {
    assets_to_withdraw: AssetInfo[];
    condition: string;
    description: string;
    id: Uint64;
    labels: string[];
    last_update_time: Uint64;
    msgs: string;
    name: string;
    owner: Addr;
    recurring: boolean;
    requeue_on_evict: boolean;
    reward: Uint128;
    status: JobStatus;
    terminate_condition?: string | null;
    vars: string;
  }
  export interface JobsResponse {
    jobs: Job[];
    total_count: number;
  }
}
