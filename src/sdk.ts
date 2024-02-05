import { warp_controller, warp_resolver, warp_account } from './types/contracts';
import { WalletLike, Wallet, wallet } from './wallet';
import { Condition } from './condition';
import {
  contractQuery,
  nativeTokenDenom,
  Token,
  computeBurnFee,
  computeCreationFee,
  computeMaintenanceFee,
  calculateDurationDaysAdjustmentFactor,
} from './utils';
import { TxInfo, LCDClientConfig, LCDClient, Coins, Coin } from '@terra-money/feather.js';
import Big from 'big.js';
import { TxModule, ChainModule, ChainName, NetworkName } from './modules';
import { cosmosMsgToCreateTxMsg } from './utils';
import { warp_templates } from './types/contracts/warp_templates';
import { Job, parseJob } from './types/job';
import { warp_account_tracker } from './types/contracts';

const FEE_ADJUSTMENT_FACTOR = 8;

export type EstimateJobMsg = {
  vars: string;
  recurring: boolean;
  executions: warp_controller.Execution[];
  duration_days: string;
};

export class WarpSdk {
  public wallet: Wallet;
  public condition: Condition;
  public tx: TxModule;
  public chain: ChainModule;

  constructor(walletLike: WalletLike, chainConfig: LCDClientConfig) {
    this.wallet = wallet(walletLike, chainConfig);
    this.tx = new TxModule(this);
    this.chain = new ChainModule(chainConfig);
    this.condition = new Condition(this.wallet, this.chain.contracts, this);
  }

  public static lcdClientConfig(
    networks: NetworkName[] = ['mainnet', 'testnet'],
    chains: ChainName[] = ChainModule.supportedChains().map((c) => c.name)
  ): Record<string, LCDClientConfig> {
    return ChainModule.lcdClientConfig(networks, chains);
  }

  public static lcdClient(
    input: {
      chains?: ChainName[];
      networks?: NetworkName[];
    } = {}
  ): LCDClient {
    return ChainModule.lcdClient(input);
  }

  public async isJobActive(jobId: string): Promise<boolean> {
    const job = await this.job(jobId);

    for (let execution of job.executions) {
      const isCondActive = this.condition.resolveCond(execution.condition, job);

      if (isCondActive) {
        return true;
      }
    }

    return false;
  }

  public async jobs(opts: warp_controller.QueryJobsMsg = {}): Promise<Job[]> {
    const { jobs } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_jobs: {} }>,
      warp_controller.JobsResponse
    >(this.wallet.lcd, this.chain.contracts.controller, { query_jobs: opts });

    return jobs.map(parseJob);
  }

  public async job(id: string): Promise<Job> {
    const { job } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_job: {} }>,
      warp_controller.JobResponse
    >(this.wallet.lcd, this.chain.contracts.controller, { query_job: { id } });

    return parseJob(job);
  }

  public async templates(opts: warp_templates.QueryTemplatesMsg = {}): Promise<warp_templates.Template[]> {
    const { templates } = await contractQuery<
      Extract<warp_templates.QueryMsg, { query_templates: {} }>,
      warp_templates.TemplatesResponse
    >(this.wallet.lcd, this.chain.contracts.templates, { query_templates: opts });

    return templates;
  }

  public async template(id: string): Promise<warp_templates.Template> {
    const { template } = await contractQuery<
      Extract<warp_templates.QueryMsg, { query_template: {} }>,
      warp_templates.TemplateResponse
    >(this.wallet.lcd, this.chain.contracts.templates, { query_template: { id } });

    return template;
  }

  public async simulateQuery(query: warp_resolver.QueryRequestFor_String): Promise<object> {
    const { response } = await contractQuery<
      Extract<warp_resolver.QueryMsg, { simulate_query: {} }>,
      warp_resolver.SimulateResponse
    >(this.wallet.lcd, this.chain.contracts.resolver, { simulate_query: { query } });

    return JSON.parse(response);
  }

  public async validateJobCreation(msg: warp_resolver.QueryValidateJobCreationMsg): Promise<string> {
    const response = await contractQuery<Extract<warp_resolver.QueryMsg, { query_validate_job_creation: {} }>, string>(
      this.wallet.lcd,
      this.chain.contracts.resolver,
      { query_validate_job_creation: msg }
    );

    return response;
  }

  public async hydrateVars(msg: warp_resolver.QueryHydrateVarsMsg): Promise<string> {
    const resp = await contractQuery<Extract<warp_resolver.QueryMsg, { query_hydrate_vars: {} }>, string>(
      this.wallet.lcd,
      this.chain.contracts.resolver,
      { query_hydrate_vars: msg }
    );

    return resp;
  }

  public async resolveCondition(msg: warp_resolver.QueryResolveConditionMsg): Promise<boolean> {
    const response = await contractQuery<Extract<warp_resolver.QueryMsg, { query_resolve_condition: {} }>, boolean>(
      this.wallet.lcd,
      this.chain.contracts.resolver,
      { query_resolve_condition: msg }
    );

    return response;
  }

  public async applyVarFn(msg: warp_resolver.QueryApplyVarFnMsg): Promise<string> {
    const response = await contractQuery<Extract<warp_resolver.QueryMsg, { query_apply_var_fn: {} }>, string>(
      this.wallet.lcd,
      this.chain.contracts.resolver,
      { query_apply_var_fn: msg }
    );

    return response;
  }

  public async hydrateMsgs(msg: warp_resolver.QueryHydrateMsgsMsg): Promise<warp_resolver.WarpMsg[]> {
    const response = await contractQuery<
      Extract<warp_resolver.QueryMsg, { query_hydrate_msgs: {} }>,
      warp_resolver.WarpMsg[]
    >(this.wallet.lcd, this.chain.contracts.resolver, { query_hydrate_msgs: msg });

    return response;
  }

  public async jobAccounts(
    msg: warp_account_tracker.QueryJobAccountsMsg
  ): Promise<warp_account_tracker.JobAccountsResponse> {
    const response = await contractQuery<
      Extract<warp_account_tracker.QueryMsg, { query_job_accounts: {} }>,
      warp_account_tracker.JobAccountsResponse
    >(this.wallet.lcd, this.chain.contracts.accountTracker, { query_job_accounts: msg });

    return response;
  }

  public async firstFreeJobAccount(
    msg: warp_account_tracker.QueryFirstFreeJobAccountMsg
  ): Promise<warp_account_tracker.JobAccountResponse> {
    const response = await contractQuery<
      Extract<warp_account_tracker.QueryMsg, { query_first_free_job_account: {} }>,
      warp_account_tracker.JobAccountResponse
    >(this.wallet.lcd, this.chain.contracts.accountTracker, { query_first_free_job_account: msg });

    return response;
  }

  public async firstFreeFundingAccount(
    msg: warp_account_tracker.QueryFirstFreeJobAccountMsg
  ): Promise<warp_account_tracker.FundingAccountResponse> {
    const response = await contractQuery<
      Extract<warp_account_tracker.QueryMsg, { query_first_free_funding_account: {} }>,
      warp_account_tracker.FundingAccountResponse
    >(this.wallet.lcd, this.chain.contracts.accountTracker, { query_first_free_funding_account: msg });

    return response;
  }

  public async fundingAccounts(
    msg: warp_account_tracker.QueryFundingAccountsMsg
  ): Promise<warp_account_tracker.FundingAccountsResponse> {
    const response = await contractQuery<
      Extract<warp_account_tracker.QueryMsg, { query_funding_accounts: {} }>,
      warp_account_tracker.FundingAccountsResponse
    >(this.wallet.lcd, this.chain.contracts.accountTracker, { query_funding_accounts: msg });

    return response;
  }

  public async config(): Promise<warp_controller.Config & warp_templates.Config> {
    const { config: controllerConfig } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_config: {} }>,
      warp_controller.ConfigResponse
    >(this.wallet.lcd, this.chain.contracts.controller, { query_config: {} });

    const { config: templatesConfig } = await contractQuery<
      Extract<warp_templates.QueryMsg, { query_config: {} }>,
      warp_templates.ConfigResponse
    >(this.wallet.lcd, this.chain.contracts.templates, { query_config: {} });

    return { ...controllerConfig, template_fee: templatesConfig.template_fee };
  }

  public async state(): Promise<warp_controller.State> {
    const { state: controllerState } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_state: {} }>,
      warp_controller.StateResponse
    >(this.wallet.lcd, this.chain.contracts.controller, { query_state: {} });

    return { ...controllerState };
  }

  // if reward is not provided, reward estimate is used
  public async estimateJobFee(sender: string, estimateJobMsg: EstimateJobMsg, reward?: string): Promise<Coin> {
    const state = await this.state();
    const config = await this.config();
    const denom = await this.nativeTokenDenom();
    const jobReward: Coin = reward ? new Coin(denom, reward) : await this.estimateJobReward(sender, estimateJobMsg);

    const jobRewardAmount = Big(jobReward.amount.toString());
    const burnFee = computeBurnFee(jobRewardAmount, config);
    const maintenanceFee = computeMaintenanceFee(Big(estimateJobMsg.duration_days), config);
    const creationFee = computeCreationFee(Big(state.q), config);

    const totalFee = jobRewardAmount.add(burnFee).add(creationFee).add(maintenanceFee);

    return new Coin(denom, totalFee.toFixed(0));
  }

  public async estimateJobReward(sender: string, estimateJobMsg: EstimateJobMsg): Promise<Coin> {
    const denom = await this.nativeTokenDenom();
    let estimatedReward = new Coin(denom, 0);

    for (let execution of estimateJobMsg.executions) {
      estimatedReward = estimatedReward.add(await this.estimateJobExecutionReward(sender, estimateJobMsg, execution));
    }

    const config = await this.config();

    if (Big(config.minimum_reward).gte(estimatedReward.amount.toString())) {
      return new Coin(denom, config.minimum_reward);
    }

    return estimatedReward;
  }

  public async estimateJobExecutionReward(
    sender: string,
    estimateJobMsg: EstimateJobMsg,
    execution: warp_controller.Execution
  ): Promise<Coin> {
    const hydratedVars = await this.hydrateVars({ vars: estimateJobMsg.vars });

    const hydratedMsgs = await this.hydrateMsgs({
      vars: hydratedVars,
      msgs: execution.msgs,
    });

    const msgs = [];

    msgs.push(
      ...(
        await this.tx.executeHydrateVars(sender, {
          vars: hydratedVars,
        })
      ).msgs
    );

    msgs.push(
      ...(
        await this.tx.executeHydrateMsgs(sender, {
          vars: hydratedVars,
          msgs: execution.msgs,
        })
      ).msgs
    );

    msgs.push(
      ...(
        await this.tx.executeResolveCondition(sender, {
          condition: execution.condition,
          vars: hydratedVars,
        })
      ).msgs
    );

    if (estimateJobMsg.recurring) {
      msgs.push(
        ...(
          await this.tx.executeApplyVarFn(sender, {
            vars: hydratedVars,
            status: 'Executed',
          })
        ).msgs
      );
    }

    // check only cosmos msg for estimation
    let transformedMsgs: warp_resolver.CosmosMsgFor_Empty[] = hydratedMsgs
      .map((m) => {
        if ('generic' in m) {
          return m.generic;
        }

        return null;
      })
      .filter(Boolean);

    // works only for cosmos msgs
    msgs.push(...transformedMsgs.map((msg) => cosmosMsgToCreateTxMsg(sender, msg)));

    const accountInfo = await this.wallet.lcd.auth.accountInfo(sender);

    const fee = await this.wallet.lcd.tx.estimateFee(
      [
        {
          sequenceNumber: accountInfo.getSequenceNumber(),
          publicKey: accountInfo.getPublicKey(),
        },
      ],
      {
        msgs,
        chainID: this.chain.config.chainID,
      }
    );

    const denom = await this.nativeTokenDenom();

    const durationDaysAdjustmentFactor = calculateDurationDaysAdjustmentFactor(Big(estimateJobMsg.duration_days));

    return new Coin(
      denom,
      Big(fee.amount.get(denom).amount.toString())
        .mul(FEE_ADJUSTMENT_FACTOR)
        .mul(durationDaysAdjustmentFactor)
        .toString()
    );
  }

  public async nativeTokenDenom(): Promise<string> {
    return nativeTokenDenom(this.wallet.lcd, this.chain.config.chainID);
  }

  public async createJob(sender: string, msg: warp_controller.CreateJobMsg, coins?: Coins.Input): Promise<TxInfo> {
    const txPayload = await this.tx.createJob(sender, msg, coins);

    return this.wallet.tx(txPayload);
  }

  /* creates a time series of job executions in a single tx:
   *
   * sequence: [(job1, cond1), (job2, cond2), (job3, cond3)] will be executed as:
   *
   * create (job1, cond1)
   * when cond1 active
   * then execute job1
   *       create (job2, cond2)
   *       when cond2 active
   *       then execute job2
   *            create(job3, cond3)
   *            when cond3 active
   *            then execute job3
   */
  public async createJobSequence(
    sender: string,
    sequence: warp_controller.CreateJobMsg[],
    coins?: Coins.Input
  ): Promise<TxInfo> {
    const txPayload = await this.tx.createJobSequence(sender, sequence, coins);

    return this.wallet.tx(txPayload);
  }

  public async deleteJob(sender: string, jobId: string): Promise<TxInfo> {
    const txPayload = await this.tx.deleteJob(sender, jobId);

    return this.wallet.tx(txPayload);
  }

  public async updateJob(sender: string, msg: warp_controller.UpdateJobMsg): Promise<TxInfo> {
    const txPayload = await this.tx.updateJob(sender, msg);

    return this.wallet.tx(txPayload);
  }

  public async evictJob(sender: string, jobId: string): Promise<TxInfo> {
    const txPayload = await this.tx.evictJob(sender, jobId);

    return this.wallet.tx(txPayload);
  }

  public async executeJob(sender: string, jobId: string): Promise<TxInfo> {
    const txPayload = await this.tx.executeJob(sender, jobId);

    return this.wallet.tx(txPayload);
  }

  public async createFundingAccount(sender: string, funds?: Coins.Input): Promise<TxInfo> {
    const txPayload = await this.tx.createFundingAccount(sender, funds);

    return this.wallet.tx(txPayload);
  }

  public async submitTemplate(sender: string, msg: warp_templates.SubmitTemplateMsg): Promise<TxInfo> {
    const txPayload = await this.tx.submitTemplate(sender, msg);

    return this.wallet.tx(txPayload);
  }

  public async deleteTemplate(sender: string, templateId: string): Promise<TxInfo> {
    const txPayload = await this.tx.deleteTemplate(sender, templateId);

    return this.wallet.tx(txPayload);
  }

  public async editTemplate(sender: string, msg: warp_templates.EditTemplateMsg): Promise<TxInfo> {
    const txPayload = await this.tx.editTemplate(sender, msg);

    return this.wallet.tx(txPayload);
  }

  public async withdrawAssets(sender: string, job_id: string, msg: warp_account.WithdrawAssetsMsg): Promise<TxInfo> {
    const txPayload = await this.tx.withdrawAssets(sender, job_id, msg);

    return this.wallet.tx(txPayload);
  }

  public async depositToAccount(sender: string, account: string, token: Token, amount: string): Promise<TxInfo> {
    const txPayload = await this.tx.depositToAccount(sender, account, token, amount);

    return this.wallet.tx(txPayload);
  }

  public async withdrawFromAccount(
    sender: string,
    account: string,
    receiver: string,
    token: Token,
    amount: string
  ): Promise<TxInfo> {
    const txPayload = await this.tx.withdrawFromAccount(sender, account, receiver, token, amount);

    return this.wallet.tx(txPayload);
  }
}
