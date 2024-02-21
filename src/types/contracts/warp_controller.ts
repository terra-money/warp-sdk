export module warp_controller {
  export type Addr = string;
  export type Uint128 = string;
  export type Uint64 = string;
  export interface Config {
    account_tracker_address: Addr;
    burn_fee_min: Uint128;
    burn_fee_rate: Uint128;
    cancellation_fee_rate: Uint64;
    creation_fee_max: Uint128;
    creation_fee_min: Uint128;
    duration_days_max: Uint64;
    duration_days_min: Uint64;
    fee_collector: Addr;
    fee_denom: string;
    maintenance_fee_max: Uint128;
    maintenance_fee_min: Uint128;
    minimum_reward: Uint128;
    owner: Addr;
    queue_size_left: Uint64;
    queue_size_right: Uint64;
    resolver_address: Addr;
    warp_account_code_id: Uint64;
  }
  export interface ConfigResponse {
    config: Config;
  }
  export type ExecuteMsg =
    | {
        create_job: CreateJobMsg;
      }
    | {
        delete_job: DeleteJobMsg;
      }
    | {
        update_job: UpdateJobMsg;
      }
    | {
        execute_job: ExecuteJobMsg;
      }
    | {
        evict_job: EvictJobMsg;
      }
    | {
        update_config: UpdateConfigMsg;
      }
    | {
        migrate_accounts: MigrateAccountsMsg;
      }
    | {
        migrate_pending_jobs: MigrateJobsMsg;
      }
    | {
        migrate_finished_jobs: MigrateJobsMsg;
      };
  export type WarpMsg =
    | {
        generic: CosmosMsgFor_Empty;
      }
    | {
        ibc_transfer: IbcTransferMsg;
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
  export type CwFund =
    | {
        cw20: Cw20Fund;
      }
    | {
        cw721: Cw721Fund;
      };
  export interface CreateJobMsg {
    account_msgs?: WarpMsg[] | null;
    assets_to_withdraw?: AssetInfo[] | null;
    cw_funds?: CwFund[] | null;
    description: string;
    duration_days: Uint64;
    executions: Execution[];
    funding_account?: Addr | null;
    labels: string[];
    name: string;
    operational_amount: Uint128;
    recurring: boolean;
    reward: Uint128;
    terminate_condition?: string | null;
    vars: string;
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
  export interface IbcTransferMsg {
    timeout_block_delta?: number | null;
    timeout_timestamp_seconds_delta?: number | null;
    transfer_msg: TransferMsg;
  }
  export interface TransferMsg {
    memo: string;
    receiver: string;
    sender: string;
    source_channel: string;
    source_port: string;
    timeout_block?: TimeoutBlock | null;
    timeout_timestamp?: number | null;
    token?: Coin | null;
  }
  export interface TimeoutBlock {
    revision_height?: number | null;
    revision_number?: number | null;
  }
  export interface WithdrawAssetsMsg {
    asset_infos: AssetInfo[];
  }
  export interface Cw20Fund {
    amount: Uint128;
    contract_addr: string;
  }
  export interface Cw721Fund {
    contract_addr: string;
    token_id: string;
  }
  export interface Execution {
    condition: string;
    msgs: string;
  }
  export interface DeleteJobMsg {
    id: Uint64;
  }
  export interface UpdateJobMsg {
    description?: string | null;
    id: Uint64;
    labels?: string[] | null;
    name?: string | null;
  }
  export interface ExecuteJobMsg {
    external_inputs?: ExternalInput[] | null;
    id: Uint64;
  }
  export interface ExternalInput {
    input: string;
    name: string;
  }
  export interface EvictJobMsg {
    id: Uint64;
  }
  export interface UpdateConfigMsg {
    burn_fee_min?: Uint128 | null;
    burn_fee_rate?: Uint128 | null;
    cancellation_fee_rate?: Uint64 | null;
    creation_fee_max?: Uint128 | null;
    creation_fee_min?: Uint128 | null;
    duration_days_max?: Uint64 | null;
    duration_days_min?: Uint64 | null;
    fee_collector?: string | null;
    maintenance_fee_max?: Uint128 | null;
    maintenance_fee_min?: Uint128 | null;
    minimum_reward?: Uint128 | null;
    owner?: string | null;
    queue_size_left?: Uint64 | null;
    queue_size_right?: Uint64 | null;
  }
  export interface MigrateAccountsMsg {
    account_owner_addr: string;
    limit: number;
    start_after?: string | null;
    warp_account_code_id: Uint64;
  }
  export interface MigrateJobsMsg {
    limit: number;
    start_after?: Uint64 | null;
  }
  export interface CreateFundingAccountMsg {}
  export interface InstantiateMsg {
    account_tracker_code_id: Uint64;
    burn_fee_min: Uint128;
    burn_fee_rate: Uint128;
    cancellation_fee_rate: Uint64;
    creation_fee_max: Uint128;
    creation_fee_min: Uint128;
    duration_days_max: Uint64;
    duration_days_min: Uint64;
    fee_collector?: string | null;
    fee_denom: string;
    maintenance_fee_max: Uint128;
    maintenance_fee_min: Uint128;
    minimum_reward: Uint128;
    owner?: string | null;
    queue_size_left: Uint64;
    queue_size_right: Uint64;
    resolver_address: string;
    warp_account_code_id: Uint64;
  }
  export type JobStatus = 'Pending' | 'Executed' | 'Failed' | 'Cancelled' | 'Evicted';
  export interface JobResponse {
    job: Job;
  }
  export interface Job {
    account: Addr;
    assets_to_withdraw: AssetInfo[];
    created_at_time: Uint64;
    description: string;
    duration_days: Uint64;
    executions: Execution[];
    funding_account?: Addr | null;
    id: Uint64;
    labels: string[];
    last_update_time: Uint64;
    name: string;
    owner: Addr;
    prev_id?: Uint64 | null;
    recurring: boolean;
    reward: Uint128;
    status: JobStatus;
    terminate_condition?: string | null;
    vars: string;
  }
  export interface JobsResponse {
    jobs: Job[];
    total_count: number;
  }
  export type QueryMsg =
    | {
        query_job: QueryJobMsg;
      }
    | {
        query_jobs: QueryJobsMsg;
      }
    | {
        query_config: QueryConfigMsg;
      }
    | {
        query_state: QueryStateMsg;
      };
  export interface QueryJobMsg {
    id: Uint64;
  }
  export interface QueryJobsMsg {
    active?: boolean | null;
    condition_status?: boolean | null;
    ids?: Uint64[] | null;
    job_status?: JobStatus | null;
    limit?: number | null;
    name?: string | null;
    owner?: Addr | null;
    start_after?: JobIndex | null;
  }
  export interface JobIndex {
    _0: Uint128;
    _1: Uint64;
  }
  export interface QueryConfigMsg {}
  export interface QueryStateMsg {}
  export interface State {
    current_job_id: Uint64;
    q: Uint64;
  }
  export interface StateResponse {
    state: State;
  }
}
