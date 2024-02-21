export module warp_templates {
  export type Addr = string;
  export type Uint128 = string;
  export interface Config {
    fee_collector: Addr;
    fee_denom: string;
    owner: Addr;
    template_fee: Uint128;
  }
  export interface ConfigResponse {
    config: Config;
  }
  export type ExecuteMsg =
    | {
        submit_template: SubmitTemplateMsg;
      }
    | {
        edit_template: EditTemplateMsg;
      }
    | {
        delete_template: DeleteTemplateMsg;
      }
    | {
        update_config: UpdateConfigMsg;
      };
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
  export type FnValue =
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
      }
    | {
        string: StringValueFor_String;
      };
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
  export type StringValueFor_String =
    | {
        simple: string;
      }
    | {
        ref: string;
      }
    | {
        env: StringEnvValue;
      };
  export type StringEnvValue = 'warp_account_addr';
  export type VariableKind = 'string' | 'uint' | 'int' | 'decimal' | 'timestamp' | 'bool' | 'amount' | 'asset' | 'json';
  export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';
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
  export type Uint64 = string;
  export interface SubmitTemplateMsg {
    executions: Execution[];
    formatted_str: string;
    name: string;
    vars: Variable[];
  }
  export interface Execution {
    condition: string;
    msgs: string;
  }
  export interface StaticVariable {
    encode: boolean;
    init_fn: FnValue;
    kind: VariableKind;
    name: string;
    reinitialize: boolean;
    update_fn?: UpdateFn | null;
    value?: string | null;
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
  export interface NumExprValueForInt128And_NumExprOpAnd_IntFnOp {
    left: NumValueForInt128And_NumExprOpAnd_IntFnOp;
    op: NumExprOp;
    right: NumValueForInt128And_NumExprOpAnd_IntFnOp;
  }
  export interface NumFnValueForInt128And_NumExprOpAnd_IntFnOp {
    op: IntFnOp;
    right: NumValueForInt128And_NumExprOpAnd_IntFnOp;
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
  export interface UpdateFn {
    on_error?: FnValue | null;
    on_success?: FnValue | null;
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
  export interface EditTemplateMsg {
    id: Uint64;
    name?: string | null;
  }
  export interface DeleteTemplateMsg {
    id: Uint64;
  }
  export interface UpdateConfigMsg {
    fee_collector?: string | null;
    fee_denom?: string | null;
    owner?: string | null;
    template_fee?: Uint128 | null;
  }
  export interface InstantiateMsg {
    fee_collector: string;
    fee_denom: string;
    owner: string;
    templates: Template[];
  }
  export interface Template {
    executions: Execution[];
    formatted_str: string;
    id: Uint64;
    name: string;
    owner: Addr;
    vars: Variable[];
  }
  export type QueryMsg =
    | {
        query_template: QueryTemplateMsg;
      }
    | {
        query_templates: QueryTemplatesMsg;
      }
    | {
        query_config: QueryConfigMsg;
      };
  export interface QueryTemplateMsg {
    id: Uint64;
  }
  export interface QueryTemplatesMsg {
    ids?: Uint64[] | null;
    limit?: number | null;
    name?: string | null;
    owner?: Addr | null;
    start_after?: Uint64 | null;
  }
  export interface QueryConfigMsg {}
  export interface TemplateResponse {
    template: Template;
  }
  export interface TemplatesResponse {
    templates: Template[];
  }
}
