export module warp_account_tracker {
  export type Addr = string;
  export type Uint64 = string;
  export interface Account {
    addr: Addr;
    taken_by_job_id?: Uint64 | null;
  }
  export interface AccountResponse {
    account?: Account | null;
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
        add_funding_account: AddFundingAccountMsg;
      };
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
  export interface AddFundingAccountMsg {
    account_addr: string;
    account_owner_addr: string;
  }
  export interface FundingAccountResponse {
    funding_account?: FundingAccount | null;
  }
  export interface FundingAccount {
    account_addr: Addr;
    taken_by_job_ids: Uint64[];
  }
  export interface FundingAccountsResponse {
    funding_accounts: FundingAccount[];
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
        query_taken_job_accounts: QueryTakenJobAccountsMsg;
      }
    | {
        query_free_job_accounts: QueryFreeJobAccountsMsg;
      }
    | {
        query_first_free_job_account: QueryFirstFreeJobAccountMsg;
      }
    | {
        query_first_free_funding_account: QueryFirstFreeFundingAccountMsg;
      }
    | {
        query_funding_accounts: QueryFundingAccountsMsg;
      }
    | {
        query_funding_account: QueryFundingAccountMsg;
      };
  export interface QueryConfigMsg {}
  export interface QueryTakenJobAccountsMsg {
    account_owner_addr: string;
    limit?: number | null;
    start_after?: string | null;
  }
  export interface QueryFreeJobAccountsMsg {
    account_owner_addr: string;
    limit?: number | null;
    start_after?: string | null;
  }
  export interface QueryFirstFreeJobAccountMsg {
    account_owner_addr: string;
  }
  export interface QueryFirstFreeFundingAccountMsg {
    account_owner_addr: string;
  }
  export interface QueryFundingAccountsMsg {
    account_owner_addr: string;
  }
  export interface QueryFundingAccountMsg {
    account_addr: string;
    account_owner_addr: string;
  }
}
