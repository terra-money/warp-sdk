export module warp_account { 
export type Addr = string
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
      wasm: WasmMsg;
    }
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
    }
export type Uint128 = string
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
    }
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
    }
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
    }
export type Binary = string
export interface ExecuteMsg {
  msgs: CosmosMsgFor_Empty[];
}
export interface Coin {
  amount: Uint128;
  denom: string;
  
}
export interface Empty {
  
}
export interface InstantiateMsg {
  owner: string;
}
export type Condition =
  | {
      and: Condition[];
    }
  | {
      or: Condition[];
    }
  | {
      not: Condition;
    }
  | {
      expr: Expr;
    }
export type Expr =
  | {
      string: GenExprFor_ValueFor_StringAnd_StringOp;
    }
  | {
      uint: GenExprFor_NumValueFor_Uint256And_NumExprOpAnd_IntFnOpAnd_NumOp;
    }
  | {
      int: GenExprFor_NumValueForInt128And_NumExprOpAnd_IntFnOpAnd_NumOp;
    }
  | {
      decimal: GenExprFor_NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOpAnd_NumOp;
    }
  | {
      timestamp: TimeExpr;
    }
  | {
      block_height: BlockExpr;
    }
  | {
      bool: QueryExpr;
    }
export type ValueFor_String =
  | {
      simple: string;
    }
  | {
      query: QueryExpr;
    }
export type QueryRequestFor_String =
  | {
      bank: BankQuery;
    }
  | {
      custom: string;
    }
  | {
      staking: StakingQuery;
    }
  | {
      wasm: WasmQuery;
    }
export type BankQuery =
  | {
      balance: {
        address: string;
        denom: string;
        
      };
    }
  | {
      all_balances: {
        address: string;
        
      };
    }
export type StakingQuery =
  | {
      bonded_denom: {
        
      };
    }
  | {
      all_delegations: {
        delegator: string;
        
      };
    }
  | {
      delegation: {
        delegator: string;
        validator: string;
        
      };
    }
  | {
      all_validators: {
        
      };
    }
  | {
      validator: {
        /**
         * The validator's address (e.g. (e.g. cosmosvaloper1...))
         */
        address: string;
        
      };
    }
export type WasmQuery =
  | {
      smart: {
        contract_addr: string;
        /**
         * msg is the json-encoded QueryMsg struct
         */
        msg: Binary;
        
      };
    }
  | {
      raw: {
        contract_addr: string;
        /**
         * Key is the raw key used in the contracts Storage
         */
        key: Binary;
        
      };
    }
  | {
      contract_info: {
        contract_addr: string;
        
      };
    }
export type StringOp = "starts_with" | "ends_with" | "contains" | "eq" | "neq"
export type NumValueFor_Uint256And_NumExprOpAnd_IntFnOp =
  | {
      simple: Uint256;
    }
  | {
      expr: NumExprValueFor_Uint256And_NumExprOpAnd_IntFnOp;
    }
  | {
      query: QueryExpr;
    }
  | {
      fn: NumFnValueFor_Uint256And_NumExprOpAnd_IntFnOp;
    }
export type Uint256 = string
export type NumExprOp = "add" | "sub" | "div" | "mul" | "mod"
export type IntFnOp = "abs" | "neg"
export type NumOp = "eq" | "neq" | "lt" | "gt" | "gte" | "lte"
export type NumValueForInt128And_NumExprOpAnd_IntFnOp =
  | {
      simple: number;
    }
  | {
      expr: NumExprValueForInt128And_NumExprOpAnd_IntFnOp;
    }
  | {
      query: QueryExpr;
    }
  | {
      fn: NumFnValueForInt128And_NumExprOpAnd_IntFnOp;
    }
export type NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp =
  | {
      simple: Decimal256;
    }
  | {
      expr: NumExprValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp;
    }
  | {
      query: QueryExpr;
    }
  | {
      fn: NumFnValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp;
    }
export type Decimal256 = string
export type DecimalFnOp = "abs" | "neg" | "floor" | "sqrt" | "ceil"
export type Uint64 = string
export type TimeOp = "lt" | "gt"
export type JobStatus = "Pending" | "Executed" | "Failed" | "Cancelled"
export interface JobResponse {
  job: Job;
}
export interface Job {
  condition: Condition;
  id: Uint64;
  last_update_time: Uint64;
  msgs: CosmosMsgFor_Empty[];
  name: string;
  owner: Addr;
  reward: Uint128;
  status: JobStatus;
}
export interface GenExprFor_ValueFor_StringAnd_StringOp {
  left: ValueFor_String;
  op: StringOp;
  right: ValueFor_String;
}
export interface QueryExpr {
  name: string;
  query: QueryRequestFor_String;
  selector: string;
}
export interface GenExprFor_NumValueFor_Uint256And_NumExprOpAnd_IntFnOpAnd_NumOp {
  left: NumValueFor_Uint256And_NumExprOpAnd_IntFnOp;
  op: NumOp;
  right: NumValueFor_Uint256And_NumExprOpAnd_IntFnOp;
}
export interface NumExprValueFor_Uint256And_NumExprOpAnd_IntFnOp {
  left: NumValueFor_Uint256And_NumExprOpAnd_IntFnOp;
  op: NumExprOp;
  right: NumValueFor_Uint256And_NumExprOpAnd_IntFnOp;
}
export interface NumFnValueFor_Uint256And_NumExprOpAnd_IntFnOp {
  op: IntFnOp;
  right: NumValueFor_Uint256And_NumExprOpAnd_IntFnOp;
}
export interface GenExprFor_NumValueForInt128And_NumExprOpAnd_IntFnOpAnd_NumOp {
  left: NumValueForInt128And_NumExprOpAnd_IntFnOp;
  op: NumOp;
  right: NumValueForInt128And_NumExprOpAnd_IntFnOp;
}
export interface NumExprValueForInt128And_NumExprOpAnd_IntFnOp {
  left: NumValueForInt128And_NumExprOpAnd_IntFnOp;
  op: NumExprOp;
  right: NumValueForInt128And_NumExprOpAnd_IntFnOp;
}
export interface NumFnValueForInt128And_NumExprOpAnd_IntFnOp {
  op: IntFnOp;
  right: NumValueForInt128And_NumExprOpAnd_IntFnOp;
}
export interface GenExprFor_NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOpAnd_NumOp {
  left: NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp;
  op: NumOp;
  right: NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp;
}
export interface NumExprValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
  left: NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp;
  op: NumExprOp;
  right: NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp;
}
export interface NumFnValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp {
  op: DecimalFnOp;
  right: NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp;
}
export interface TimeExpr {
  comparator: Uint64;
  op: TimeOp;
}
export interface BlockExpr {
  comparator: Uint64;
  op: NumOp;
}
export interface JobsResponse {
  jobs: Job[];
  total_count: number;
} }