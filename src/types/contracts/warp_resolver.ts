export module warp_resolver {
  export type Condition =
    | {
        and: Condition1[];
      }
    | {
        or: Condition1[];
      }
    | {
        not: Condition1;
      }
    | {
        expr: Expr;
      };
  export type Condition1 =
    | {
        and: Condition1[];
      }
    | {
        or: Condition1[];
      }
    | {
        not: Condition1;
      }
    | {
        expr: Expr;
      };
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
        bool: string;
      };
  export type ValueFor_String =
    | {
        simple: string;
      }
    | {
        ref: string;
      };
  export type StringOp = 'starts_with' | 'ends_with' | 'contains' | 'eq' | 'neq';
  export type NumValueFor_Uint256And_NumExprOpAnd_IntFnOp =
    | {
        simple: Uint256;
      }
    | {
        expr: NumExprValueFor_Uint256And_NumExprOpAnd_IntFnOp;
      }
    | {
        ref: string;
      }
    | {
        fn: NumFnValueFor_Uint256And_NumExprOpAnd_IntFnOp;
      }
    | {
        env: NumEnvValue;
      };
  export type Uint256 = string;
  export type NumExprOp = 'add' | 'sub' | 'div' | 'mul' | 'mod';
  export type IntFnOp = 'abs' | 'neg';
  export type NumEnvValue = 'time' | 'block_height';
  export type NumOp = 'eq' | 'neq' | 'lt' | 'gt' | 'gte' | 'lte';
  export type NumValueForInt128And_NumExprOpAnd_IntFnOp =
    | {
        simple: number;
      }
    | {
        expr: NumExprValueForInt128And_NumExprOpAnd_IntFnOp;
      }
    | {
        ref: string;
      }
    | {
        fn: NumFnValueForInt128And_NumExprOpAnd_IntFnOp;
      }
    | {
        env: NumEnvValue;
      };
  export type NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp =
    | {
        simple: Decimal256;
      }
    | {
        expr: NumExprValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp;
      }
    | {
        ref: string;
      }
    | {
        fn: NumFnValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp;
      }
    | {
        env: NumEnvValue;
      };
  export type Decimal256 = string;
  export type DecimalFnOp = 'abs' | 'neg' | 'floor' | 'sqrt' | 'ceil';
  export type Uint64 = string;
  export type TimeOp = 'lt' | 'gt';
  export interface GenExprFor_ValueFor_StringAnd_StringOp {
    left: ValueFor_String;
    op: StringOp;
    right: ValueFor_String;
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
  export type ExecuteMsg = {
    execute_simulate_query: ExecuteSimulateQueryMsg;
  };
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
        stargate: {
          /**
           * this is the expected protobuf message type (not any), binary encoded
           */
          data: Binary;
          /**
           * this is the fully qualified service path used for routing, eg. custom/cosmos_sdk.x.bank.v1.Query/QueryBalance
           */
          path: string;
        };
      }
    | {
        ibc: IbcQuery;
      }
    | {
        wasm: WasmQuery;
      };
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
      };
  export type StakingQuery =
    | {
        bonded_denom: {};
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
        all_validators: {};
      }
    | {
        validator: {
          /**
           * The validator's address (e.g. (e.g. cosmosvaloper1...))
           */
          address: string;
        };
      };
  export type Binary = string;
  export type IbcQuery =
    | {
        port_id: {};
      }
    | {
        list_channels: {
          port_id?: string | null;
        };
      }
    | {
        channel: {
          channel_id: string;
          port_id?: string | null;
        };
      };
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
      };
  export interface ExecuteSimulateQueryMsg {
    query: QueryRequestFor_String;
  }
  export interface InstantiateMsg {}
  export type QueryMsg =
    | {
        simulate_query: SimulateQueryMsg;
      }
    | {
        query_validate_job_creation: QueryValidateJobCreationMsg;
      }
    | {
        query_hydrate_vars: QueryHydrateVarsMsg;
      }
    | {
        query_resolve_condition: QueryResolveConditionMsg;
      }
    | {
        query_apply_var_fn: QueryApplyVarFnMsg;
      }
    | {
        query_hydrate_msgs: QueryHydrateMsgsMsg;
      };
  export type JobStatus = 'Pending' | 'Executed' | 'Failed' | 'Cancelled' | 'Evicted';
  export interface SimulateQueryMsg {
    query: QueryRequestFor_String;
  }
  export interface QueryValidateJobCreationMsg {
    condition: string;
    msgs: string;
    terminate_condition?: string | null;
    vars: string;
  }
  export interface QueryHydrateVarsMsg {
    external_inputs?: ExternalInput[] | null;
    vars: string;
  }
  export interface ExternalInput {
    input: string;
    name: string;
  }
  export interface QueryResolveConditionMsg {
    condition: string;
    vars: string;
  }
  export interface QueryApplyVarFnMsg {
    status: JobStatus;
    vars: string;
  }
  export interface QueryHydrateMsgsMsg {
    msgs: string;
    vars: string;
  }
  export interface ResolveResponse {
    response: string;
  }
  export interface SimulateResponse {
    response: string;
  }
  export type Variable =
    | {
        static: StaticVariable;
      }
    | {
        external: ExternalVariable;
      }
    | {
        query: QueryVariable;
      };
  export type VariableKind = 'string' | 'uint' | 'int' | 'decimal' | 'timestamp' | 'bool' | 'amount' | 'asset' | 'json';
  export type UpdateFnValue =
    | {
        uint: NumValueFor_Uint256And_NumExprOpAnd_IntFnOp;
      }
    | {
        int: NumValueForInt128And_NumExprOpAnd_IntFnOp;
      }
    | {
        decimal: NumValueFor_Decimal256And_NumExprOpAnd_DecimalFnOp;
      }
    | {
        timestamp: NumValueForInt128And_NumExprOpAnd_IntFnOp;
      }
    | {
        block_height: NumValueForInt128And_NumExprOpAnd_IntFnOp;
      }
    | {
        bool: string;
      };
  export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';
  export interface StaticVariable {
    encode: boolean;
    kind: VariableKind;
    name: string;
    update_fn?: UpdateFn | null;
    value: string;
  }
  export interface UpdateFn {
    on_error?: UpdateFnValue | null;
    on_success?: UpdateFnValue | null;
  }
  export interface ExternalVariable {
    encode: boolean;
    init_fn: ExternalExpr;
    kind: VariableKind;
    name: string;
    reinitialize: boolean;
    update_fn?: UpdateFn | null;
    value?: string | null;
  }
  export interface ExternalExpr {
    body?: string | null;
    headers?: {
      [k: string]: string;
    } | null;
    method?: Method | null;
    selector: string;
    url: string;
  }
  export interface QueryVariable {
    encode: boolean;
    init_fn: QueryExpr;
    kind: VariableKind;
    name: string;
    reinitialize: boolean;
    update_fn?: UpdateFn | null;
    value?: string | null;
  }
  export interface QueryExpr {
    query: QueryRequestFor_String;
    selector: string;
  }
}
