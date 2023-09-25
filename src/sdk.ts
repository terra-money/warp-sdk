import { warp_account, warp_controller, warp_resolver } from './types/contracts';
import { WalletLike, Wallet, wallet } from './wallet';
import { Condition } from './condition';
import {
  base64encode,
  contractQuery,
  nativeTokenDenom,
  Token,
  TransferMsg,
  TransferNftMsg,
  computeBurnFee,
  computeCreationFee,
  computeMaintenanceFee,
  feeConfigByChainId,
} from './utils';
import { CreateTxOptions, TxInfo, LCDClientConfig, LCDClient } from '@terra-money/feather.js';
import { TxBuilder } from './tx';
import Big from 'big.js';
import { JobSequenceMsgComposer } from './composers';
import { resolveExternalInputs } from './variables';
import { TxModule, ChainModule, ChainName, NetworkName } from './modules';
import { cosmosMsgToCreateTxMsg } from './utils';
import { warp_templates } from './types/contracts/warp_templates';
import { Fund, Job, mergeFunds, parseJob } from './types/job';

const FEE_ADJUSTMENT_FACTOR = 3;

export type EstimateJobMsg = Omit<warp_controller.CreateJobMsg, 'reward'> & {
  duration_days: number;
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
    this.condition = new Condition(this.wallet, this.chain.contracts);
  }

  public static lcdClientConfig(
    networks: NetworkName[] = ['mainnet', 'testnet'],
    chains: ChainName[] = ['terra', 'neutron', 'injective']
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
    return this.condition.resolveCond(job.condition, job.vars);
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

  public async hydrateMsgs(msg: warp_resolver.QueryHydrateMsgsMsg): Promise<warp_resolver.CosmosMsgFor_Empty[]> {
    const response = await contractQuery<
      Extract<warp_resolver.QueryMsg, { query_hydrate_msgs: {} }>,
      warp_resolver.CosmosMsgFor_Empty[]
    >(this.wallet.lcd, this.chain.contracts.resolver, { query_hydrate_msgs: msg });

    return response;
  }

  public async account(owner: string): Promise<warp_controller.Account> {
    const { account } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_account: {} }>,
      warp_controller.AccountResponse
    >(this.wallet.lcd, this.chain.contracts.controller, { query_account: { owner } });

    return account;
  }

  public async accounts(opts: warp_controller.QueryAccountsMsg): Promise<warp_controller.Account[]> {
    const { accounts } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_accounts: {} }>,
      warp_controller.AccountsResponse
    >(this.wallet.lcd, this.chain.contracts.controller, { query_accounts: opts });

    return accounts;
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

  public async estimateJobReward(sender: string, estimateJobMsg: EstimateJobMsg): Promise<Big> {
    const account = await this.account(sender);

    const hydratedVars = await this.hydrateVars({ vars: estimateJobMsg.vars });

    const hydratedMsgs = await this.hydrateMsgs({
      vars: hydratedVars,
      msgs: estimateJobMsg.msgs,
    });

    const msgs = [];

    msgs.push(
      ...(
        await this.tx.executeHydrateVars(account.account, {
          vars: hydratedVars,
        })
      ).msgs
    );

    msgs.push(
      ...(
        await this.tx.executeHydrateMsgs(account.account, {
          vars: hydratedVars,
          msgs: estimateJobMsg.msgs,
        })
      ).msgs
    );

    msgs.push(
      ...(
        await this.tx.executeResolveCondition(account.account, {
          condition: estimateJobMsg.condition,
          vars: hydratedVars,
        })
      ).msgs
    );

    if (estimateJobMsg.recurring) {
      msgs.push(
        ...(
          await this.tx.executeApplyVarFn(account.account, {
            vars: hydratedVars,
            status: 'Executed',
          })
        ).msgs
      );
    }

    msgs.push(...hydratedMsgs.map((msg) => cosmosMsgToCreateTxMsg(account.account, msg)));

    const accountInfo = await this.wallet.lcd.auth.accountInfo(account.account);

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

    return Big(fee.amount.get(denom).amount.toString()).mul(FEE_ADJUSTMENT_FACTOR);
  }

  public async estimateJobFee(sender: string, estimateJobMsg: EstimateJobMsg): Promise<Big> {
    const state = await this.state();
    const feeConfig = feeConfigByChainId[this.chain.config.chainID];

    const jobRewardMicro = await this.estimateJobReward(sender, estimateJobMsg);
    const jobRewardUnmicro = jobRewardMicro.div(Big(10).pow(feeConfig.nativeToken.decimals));

    const burnFeeUnmicro = computeBurnFee(jobRewardUnmicro, feeConfig);
    const maintenanceFeeUnmicro = computeMaintenanceFee(estimateJobMsg.duration_days, feeConfig);
    const creationFeeUnmicro = computeCreationFee(Number(state.q), feeConfig);

    const totalFeeUnmicro = jobRewardUnmicro.add(burnFeeUnmicro).add(creationFeeUnmicro).add(maintenanceFeeUnmicro);
    const totalFeeMicro = totalFeeUnmicro.mul(Big(10).pow(feeConfig.nativeToken.decimals));

    return totalFeeMicro;
  }

  public async nativeTokenDenom(): Promise<string> {
    return nativeTokenDenom(this.wallet.lcd, this.chain.config.chainID);
  }

  public async createJob(sender: string, msg: warp_controller.CreateJobMsg, funds?: Fund[]): Promise<TxInfo> {
    const txPayload = await this.tx.createJob(sender, msg, funds);

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
    funds?: Fund[]
  ): Promise<TxInfo> {
    const txPayload = await this.tx.createJobSequence(sender, sequence, funds);

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

  public async createAccount(sender: string, funds?: Fund[]): Promise<TxInfo> {
    const txPayload = await this.tx.createAccount(sender, funds);

    return this.wallet.tx(txPayload);
  }

  public async withdrawAssets(sender: string, msg: warp_account.WithdrawAssetsMsg): Promise<TxInfo> {
    const txPayload = await this.tx.withdrawAssets(sender, msg);

    return this.wallet.tx(txPayload);
  }

  public async depositToAccount(sender: string, account: string, token: Token, amount: string): Promise<TxInfo> {
    const txPayload = await this.tx.depositToAccount(sender, account, token, amount);

    return this.wallet.tx(txPayload);
  }

  public async withdrawFromAccount(sender: string, receiver: string, token: Token, amount: string): Promise<TxInfo> {
    const txPayload = await this.tx.withdrawFromAccount(sender, receiver, token, amount);

    return this.wallet.tx(txPayload);
  }
}
