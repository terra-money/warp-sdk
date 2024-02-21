export module warp_account_tracker {
  export type Addr = string;
  export type AccountType = 'funding' | 'job';
  export interface Account {
    account_addr: Addr;
    account_type: AccountType;
    owner_addr: Addr;
  }
  export interface AccountsResponse {
    accounts: Account[];
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
        take_job_account: TakeJobAccountMsg;
      }
    | {
        free_job_account: FreeJobAccountMsg;
      }
    | {
        take_funding_account: TakeFundingAccountMsg;
      }
    | {
        free_funding_account: FreeFundingAccountMsg;
      }
    | {
        update_config: UpdateConfigMsg;
      };
  export type Uint64 = string;
  export interface TakeJobAccountMsg {
    account_addr: string;
    account_owner_addr: string;
    job_id: Uint64;
  }
  export interface FreeJobAccountMsg {
    account_addr: string;
    account_owner_addr: string;
    last_job_id: Uint64;
  }
  export interface TakeFundingAccountMsg {
    account_addr: string;
    account_owner_addr: string;
    job_id: Uint64;
  }
  export interface FreeFundingAccountMsg {
    account_addr: string;
    account_owner_addr: string;
    job_id: Uint64;
  }
  export interface UpdateConfigMsg {
    admin?: string | null;
  }
  export type AccountStatus = 'free' | 'taken';
  export interface FundingAccountResponse {
    funding_account?: FundingAccount | null;
  }
  export interface FundingAccount {
    account_addr: Addr;
    account_status: AccountStatus;
    taken_by_job_ids: Uint64[];
  }
  export interface FundingAccountsResponse {
    funding_accounts: FundingAccount[];
    total_count: number;
  }
  export interface InstantiateMsg {
    admin: string;
    warp_addr: string;
  }
  export interface JobAccountResponse {
    job_account?: JobAccount | null;
  }
  export interface JobAccount {
    account_addr: Addr;
    account_status: AccountStatus;
    taken_by_job_id: Uint64;
  }
  export interface JobAccountsResponse {
    job_accounts: JobAccount[];
    total_count: number;
  }
  export type QueryMsg =
    | {
        query_config: QueryConfigMsg;
      }
    | {
        query_accounts: QueryAccountsMsg;
      }
    | {
        query_job_accounts: QueryJobAccountsMsg;
      }
    | {
        query_job_account: QueryJobAccountMsg;
      }
    | {
        query_first_free_job_account: QueryFirstFreeJobAccountMsg;
      }
    | {
        query_funding_accounts: QueryFundingAccountsMsg;
      }
    | {
        query_funding_account: QueryFundingAccountMsg;
      }
    | {
        query_first_free_funding_account: QueryFirstFreeFundingAccountMsg;
      };
  export interface QueryConfigMsg {}
  export interface QueryAccountsMsg {
    account_owner_addr: string;
    limit?: number | null;
    start_after?: string | null;
  }
  export interface QueryJobAccountsMsg {
    account_owner_addr: string;
    account_status: AccountStatus;
    limit?: number | null;
    start_after?: string | null;
  }
  export interface QueryJobAccountMsg {
    account_addr: string;
    account_owner_addr: string;
  }
  export interface QueryFirstFreeJobAccountMsg {
    account_owner_addr: string;
  }
  export interface QueryFundingAccountsMsg {
    account_owner_addr: string;
    account_status: AccountStatus;
    limit?: number | null;
    start_after?: string | null;
  }
  export interface QueryFundingAccountMsg {
    account_addr: string;
    account_owner_addr: string;
  }
  export interface QueryFirstFreeFundingAccountMsg {
    account_owner_addr: string;
  }
}
