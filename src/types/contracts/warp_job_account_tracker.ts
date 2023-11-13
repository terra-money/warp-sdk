export module warp_job_account_tracker {
  export type Addr = string;
  export type Uint64 = string;
  export interface Account {
    addr: Addr;
    taken_by_job_id?: Uint64 | null;
  }
  export interface AccountsResponse {
    accounts: Account[];
    total_count: number;
  }
  export interface Config {
    admin: Addr;
    warp_addr: Addr;
  }
  export interface ConfigResponse {
    config: Config;
  }
  export type ExecuteMsg =
    | {
        take_account: TakeAccountMsg;
      }
    | {
        free_account: FreeAccountMsg;
      };
  export interface TakeAccountMsg {
    account_addr: string;
    account_owner_addr: string;
    job_id: Uint64;
  }
  export interface FreeAccountMsg {
    account_addr: string;
    account_owner_addr: string;
    last_job_id: Uint64;
  }
  export interface FirstFreeAccountResponse {
    account?: Account | null;
  }
  export interface InstantiateMsg {
    admin: string;
    warp_addr: string;
  }
  export type QueryMsg =
    | {
        query_config: QueryConfigMsg;
      }
    | {
        query_taken_accounts: QueryTakenAccountsMsg;
      }
    | {
        query_free_accounts: QueryFreeAccountsMsg;
      }
    | {
        query_first_free_account: QueryFirstFreeAccountMsg;
      };
  export interface QueryConfigMsg {}
  export interface QueryTakenAccountsMsg {
    account_owner_addr: string;
    limit?: number | null;
    start_after?: string | null;
  }
  export interface QueryFreeAccountsMsg {
    account_owner_addr: string;
    limit?: number | null;
    start_after?: string | null;
  }
  export interface QueryFirstFreeAccountMsg {
    account_owner_addr: string;
  }
}
