import { warp_account, warp_controller, warp_resolver } from './types/contracts';
import { WalletLike, Wallet, wallet } from './wallet';
import { Condition } from './condition';
import { base64encode, contractQuery, nativeTokenDenom, Token, TransferMsg } from './utils';
import { CreateTxOptions, TxInfo, LCDClientConfig, LCDClient } from '@terra-money/feather.js';
import { TxBuilder } from './tx';
import Big from 'big.js';
import { JobSequenceMsgComposer } from './composers';
import { resolveExternalInputs } from './variables';
import { TxModule, ChainModule, ChainName, NetworkName } from './modules';
import { cosmosMsgToCreateTxMsg } from './utils';
import { warp_templates } from './types/contracts/warp_templates';
import { Job, parseJob } from './types/job';

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

    const { config: resolverConfig } = await contractQuery<
      Extract<warp_templates.QueryMsg, { query_config: {} }>,
      warp_templates.ConfigResponse
    >(this.wallet.lcd, this.chain.contracts.templates, { query_config: {} });

    return { ...controllerConfig, template_fee: resolverConfig.template_fee };
  }

  public async estimateFee(sender: string, job: warp_controller.CreateJobMsg): Promise<Big> {
    const account = await this.account(sender);

    const hydratedVars = await this.hydrateVars({ vars: job.vars });

    const hydratedMsgs = await this.hydrateMsgs({
      vars: hydratedVars,
      msgs: job.msgs,
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
          msgs: job.msgs,
        })
      ).msgs
    );

    msgs.push(
      ...(
        await this.tx.executeResolveCondition(account.account, {
          condition: job.condition,
          vars: hydratedVars,
        })
      ).msgs
    );

    if (job.recurring) {
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

    return Big(fee.amount.get(denom).amount.toString());
  }

  public async nativeTokenDenom(): Promise<string> {
    return nativeTokenDenom(this.wallet.lcd, this.chain.config.chainID);
  }

  public async createJob(sender: string, msg: warp_controller.CreateJobMsg): Promise<TxInfo> {
    await this.createAccountIfNotExists(sender);

    const account = await this.account(sender);
    const config = await this.config();

    const nativeDenom = await nativeTokenDenom(this.wallet.lcd, this.chain.config.chainID);

    const txPayload = TxBuilder.new(this.chain.config)
      .send(account.owner, account.account, {
        [nativeDenom]: Big(msg.reward).mul(Big(config.creation_fee_percentage).add(100).div(100)).toString(),
      })
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(sender, this.chain.contracts.controller, {
        create_job: msg,
      })
      .build();

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
  public async createJobSequence(sender: string, sequence: warp_controller.CreateJobMsg[]): Promise<TxInfo> {
    await this.createAccountIfNotExists(sender);

    const account = await this.account(sender);
    const config = await this.config();

    let jobSequenceMsgComposer = JobSequenceMsgComposer.new();
    let totalReward = Big(0);

    sequence.forEach((msg) => {
      totalReward = totalReward.add(Big(msg.reward));
      jobSequenceMsgComposer = jobSequenceMsgComposer.chain(msg);
    });

    const jobSequenceMsg = jobSequenceMsgComposer.compose();

    const nativeDenom = await nativeTokenDenom(this.wallet.lcd, this.chain.config.chainID);

    const txPayload = TxBuilder.new(this.chain.config)
      .send(account.owner, account.account, {
        [nativeDenom]: Big(totalReward).mul(Big(config.creation_fee_percentage).add(100).div(100)).toString(),
      })
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(sender, this.chain.contracts.controller, {
        create_job: jobSequenceMsg,
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async createAccountIfNotExists(sender: string): Promise<warp_controller.Account> {
    try {
      const account = await this.account(sender);
      return account;
    } catch (err) {
      // account not exists
      await this.createAccount(sender);
      return this.account(sender);
    }
  }

  public async deleteJob(sender: string, jobId: string): Promise<TxInfo> {
    const txPayload = TxBuilder.new(this.chain.config)
      .execute<Extract<warp_controller.ExecuteMsg, { delete_job: {} }>>(sender, this.chain.contracts.controller, {
        delete_job: { id: jobId },
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async updateJob(sender: string, msg: warp_controller.UpdateJobMsg): Promise<TxInfo> {
    const txPayload = TxBuilder.new(this.chain.config)
      .execute<Extract<warp_controller.ExecuteMsg, { update_job: {} }>>(sender, this.chain.contracts.controller, {
        update_job: msg,
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async evictJob(sender: string, jobId: string): Promise<TxInfo> {
    const txPayload = TxBuilder.new(this.chain.config)
      .execute<Extract<warp_controller.ExecuteMsg, { evict_job: {} }>>(sender, this.chain.contracts.controller, {
        evict_job: {
          id: jobId,
        },
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async executeJob(sender: string, jobId: string): Promise<TxInfo> {
    const job = await this.job(jobId);

    const externalInputs = await resolveExternalInputs(job.vars);

    const txPayload = TxBuilder.new(this.chain.config)
      .execute<Extract<warp_controller.ExecuteMsg, { execute_job: {} }>>(sender, this.chain.contracts.controller, {
        execute_job: { id: job.id, external_inputs: externalInputs },
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async submitTemplate(sender: string, msg: warp_templates.SubmitTemplateMsg): Promise<TxInfo> {
    const config = await this.config();

    const nativeDenom = await nativeTokenDenom(this.wallet.lcd, this.chain.config.chainID);

    const txPayload = TxBuilder.new(this.chain.config)
      .execute<Extract<warp_templates.ExecuteMsg, { submit_template: {} }>>(
        sender,
        this.chain.contracts.templates,
        {
          submit_template: msg,
        },
        {
          [nativeDenom]: config.template_fee,
        }
      )
      .build();

    return this.wallet.tx(txPayload);
  }

  public async deleteTemplate(sender: string, templateId: string): Promise<TxInfo> {
    const txPayload = TxBuilder.new(this.chain.config)
      .execute<Extract<warp_templates.ExecuteMsg, { delete_template: {} }>>(sender, this.chain.contracts.templates, {
        delete_template: { id: templateId },
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async editTemplate(sender: string, msg: warp_templates.EditTemplateMsg): Promise<TxInfo> {
    const txPayload = TxBuilder.new(this.chain.config)
      .execute<Extract<warp_templates.ExecuteMsg, { edit_template: {} }>>(sender, this.chain.contracts.templates, {
        edit_template: msg,
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async createAccount(sender: string, funds?: warp_controller.Fund[]): Promise<TxInfo> {
    const txPayload = TxBuilder.new(this.chain.config)
      .execute<Extract<warp_controller.ExecuteMsg, { create_account: {} }>>(sender, this.chain.contracts.controller, {
        create_account: {
          funds,
        },
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async withdrawAssets(sender: string, msg: warp_account.WithdrawAssetsMsg): Promise<TxInfo> {
    const { account } = await this.account(sender);

    const tx = TxBuilder.new(this.chain.config)
      .execute<Extract<warp_account.ExecuteMsg, { withdraw_assets: {} }>>(sender, account, {
        withdraw_assets: msg,
      })
      .build();

    return this.wallet.tx(tx);
  }

  // deposit token (supports native, ibc and cw20 token type) from sender to warp account
  // warp account can be owned by anyone
  public async depositToAccount(sender: string, account: string, token: Token, amount: string): Promise<TxInfo> {
    let txPayload: CreateTxOptions;
    if (token.type === 'cw20') {
      txPayload = TxBuilder.new(this.chain.config)
        .execute<TransferMsg>(sender, token.token, {
          transfer: {
            amount,
            recipient: account,
          },
        })
        .build();
    } else {
      txPayload = TxBuilder.new(this.chain.config)
        .send(sender, account, { [token.denom]: amount })
        .build();
    }

    return this.wallet.tx(txPayload);
  }

  // withdraw token (supports native, ibc and cw20 token type) from sender's warp account to receiver
  // receiver can be anyone
  public async withdrawFromAccount(sender: string, receiver: string, token: Token, amount: string): Promise<TxInfo> {
    const { account } = await this.account(sender);
    let txPayload: CreateTxOptions;
    if (token.type === 'cw20') {
      const transferMsg = {
        transfer: {
          amount,
          recipient: receiver,
        },
      };

      txPayload = TxBuilder.new(this.chain.config)
        .execute<warp_account.ExecuteMsg>(sender, account, {
          generic: {
            msgs: [
              {
                wasm: {
                  execute: {
                    contract_addr: token.token,
                    msg: base64encode(transferMsg),
                    funds: [],
                  },
                },
              },
            ],
          },
        })
        .build();
    } else {
      txPayload = TxBuilder.new(this.chain.config)
        .execute<warp_account.ExecuteMsg>(sender, account, {
          generic: {
            msgs: [
              {
                bank: {
                  send: {
                    amount: [{ amount, denom: token.denom }],
                    to_address: receiver,
                  },
                },
              },
            ],
          },
        })
        .build();
    }

    return this.wallet.tx(txPayload);
  }
}
