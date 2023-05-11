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
    minimum_reward: Uint128;
    owner: Addr;
    q_max: Uint64;
    t_max: Uint64;
    t_min: Uint64;
    template_fee: Uint128;
    warp_account_code_id: Uint64;
  }
  export interface ConfigResponse {
    config: Config;
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
        withdraw_asset: WithdrawAssetMsg;
      }
    | {
        update_config: UpdateConfigMsg;
      }
    | {
        submit_template: SubmitTemplateMsg;
      }
    | {
        edit_template: EditTemplateMsg;
      }
    | {
        delete_template: DeleteTemplateMsg;
      };
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
  export type TimeOp = 'lt' | 'gt';
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
  export type Fund =
    | {
        cw20: Cw20Fund;
      }
    | {
        cw721: Cw721Fund;
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
  export interface CreateJobMsg {
    condition: Condition;
    description: string;
    labels: string[];
    msgs: string[];
    name: string;
    recurring: boolean;
    requeue_on_evict: boolean;
    reward: Uint128;
    vars: Variable[];
  }
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
  export interface StaticVariable {
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
  export interface WithdrawAssetMsg {
    asset_info: AssetInfo;
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
    template_fee?: Uint128 | null;
  }
  export interface SubmitTemplateMsg {
    condition?: Condition | null;
    formatted_str: string;
    msg: string;
    name: string;
    vars: Variable[];
  }
  export interface EditTemplateMsg {
    id: Uint64;
    name?: string | null;
  }
  export interface DeleteTemplateMsg {
    id: Uint64;
  }
  export interface InstantiateMsg {
    a_max: Uint128;
    a_min: Uint128;
    cancellation_fee: Uint64;
    creation_fee: Uint64;
    fee_collector?: string | null;
    minimum_reward: Uint128;
    owner?: string | null;
    q_max: Uint64;
    t_max: Uint64;
    t_min: Uint64;
    template_fee: Uint128;
    warp_account_code_id: Uint64;
  }
  export type JobStatus = 'Pending' | 'Executed' | 'Failed' | 'Cancelled' | 'Evicted';
  export interface JobResponse {
    job: Job;
  }
  export interface Job {
    condition: Condition;
    description: string;
    id: Uint64;
    labels: string[];
    last_update_time: Uint64;
    msgs: string[];
    name: string;
    owner: Addr;
    recurring: boolean;
    requeue_on_evict: boolean;
    reward: Uint128;
    status: JobStatus;
    vars: Variable[];
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
        simulate_query: SimulateQueryMsg;
      }
    | {
        query_account: QueryAccountMsg;
      }
    | {
        query_accounts: QueryAccountsMsg;
      }
    | {
        query_config: QueryConfigMsg;
      }
    | {
        query_template: QueryTemplateMsg;
      }
    | {
        query_templates: QueryTemplatesMsg;
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
  export interface SimulateQueryMsg {
    query: QueryRequestFor_String;
  }
  export interface QueryAccountMsg {
    owner: string;
  }
  export interface QueryAccountsMsg {
    limit?: number | null;
    start_after?: string | null;
  }
  export interface QueryConfigMsg {}
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
  export interface SimulateResponse {
    response: string;
  }
  export interface Template {
    condition?: Condition | null;
    formatted_str: string;
    id: Uint64;
    msg: string;
    name: string;
    owner: Addr;
    vars: Variable[];
  }
  export interface TemplateResponse {
    template: Template;
  }
  export interface TemplatesResponse {
    templates: Template[];
  }
}
