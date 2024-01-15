export module warp_controller {
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
  export type Uint128 = string;
  export type Uint64 = string;
  export interface Config {
    a_max: Uint128;
    a_min: Uint128;
    cancellation_fee_percentage: Uint64;
    creation_fee_percentage: Uint64;
    fee_collector: Addr;
    fee_denom: string;
    minimum_reward: Uint128;
    owner: Addr;
    q_max: Uint64;
    resolver_address: Addr;
    t_max: Uint64;
    t_min: Uint64;
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
        create_account: CreateAccountMsg;
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
  export type Fund =
    | {
        cw20: Cw20Fund;
      }
    | {
        cw721: Cw721Fund;
      };
  export interface CreateJobMsg {
    assets_to_withdraw?: AssetInfo[] | null;
    condition: string;
    description: string;
    labels: string[];
    msgs: string;
    name: string;
    recurring: boolean;
    requeue_on_evict: boolean;
    reward: Uint128;
    terminate_condition?: string | null;
    vars: string;
  }
  export interface DeleteJobMsg {
    id: Uint64;
  }
  export interface UpdateJobMsg {
    added_reward?: Uint128 | null;
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
  export interface CreateAccountMsg {
    funds?: Fund[] | null;
  }
  export interface Cw20Fund {
    amount: Uint128;
    contract_addr: string;
  }
  export interface Cw721Fund {
    contract_addr: string;
    token_id: string;
  }
  export interface UpdateConfigMsg {
    a_max?: Uint128 | null;
    a_min?: Uint128 | null;
    cancellation_fee_percentage?: Uint64 | null;
    creation_fee_percentage?: Uint64 | null;
    fee_collector?: string | null;
    minimum_reward?: Uint128 | null;
    owner?: string | null;
    q_max?: Uint64 | null;
    t_max?: Uint64 | null;
    t_min?: Uint64 | null;
  }
  export interface MigrateAccountsMsg {
    limit: number;
    start_after?: string | null;
    warp_account_code_id: Uint64;
  }
  export interface MigrateJobsMsg {
    limit: number;
    start_after?: Uint64 | null;
  }
  export interface InstantiateMsg {
    a_max: Uint128;
    a_min: Uint128;
    cancellation_fee: Uint64;
    creation_fee: Uint64;
    fee_collector?: string | null;
    fee_denom: string;
    minimum_reward: Uint128;
    owner?: string | null;
    q_max: Uint64;
    resolver_address: string;
    t_max: Uint64;
    t_min: Uint64;
    warp_account_code_id: Uint64;
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
  export type QueryMsg =
    | {
        query_job: QueryJobMsg;
      }
    | {
        query_jobs: QueryJobsMsg;
      }
    | {
        query_account: QueryAccountMsg;
      }
    | {
        query_accounts: QueryAccountsMsg;
      }
    | {
        query_config: QueryConfigMsg;
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
  export interface QueryAccountMsg {
    owner: string;
  }
  export interface QueryAccountsMsg {
    limit?: number | null;
    start_after?: string | null;
  }
  export interface QueryConfigMsg {}
}
