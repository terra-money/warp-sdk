import { warp_account, warp_controller, warp_resolver } from './types/contracts';
import { WalletLike, Wallet, wallet } from './wallet';
import { Condition } from './condition';
import { base64encode, contractQuery, nativeTokenDenom, Token, TransferMsg } from './utils';
import { CreateTxOptions, Fee, TxInfo, LCDClientConfig } from '@terra-money/feather.js';
import { TxBuilder } from './tx';
import Big from 'big.js';
import { JobSequenceMsgComposer } from './composers';
import { resolveExternalInputs } from './variables';
import { TxModule, ChainModule } from './modules';
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
    >(this.wallet.lcd, this.chain.contracts.resolver, { query_templates: opts });

    return templates;
  }

  public async template(id: string): Promise<warp_templates.Template> {
    const { template } = await contractQuery<
      Extract<warp_templates.QueryMsg, { query_template: {} }>,
      warp_templates.TemplateResponse
    >(this.wallet.lcd, this.chain.contracts.resolver, { query_template: { id } });

    return template;
  }

  public async simulateQuery(query: warp_resolver.QueryRequestFor_String): Promise<object> {
    const { response } = await contractQuery<
      Extract<warp_resolver.QueryMsg, { simulate_query: {} }>,
      warp_resolver.SimulateResponse
    >(this.wallet.lcd, this.chain.contracts.controller, { simulate_query: { query } });

    return JSON.parse(response);
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
    >(this.wallet.lcd, this.chain.contracts.resolver, { query_config: {} });

    return { ...controllerConfig, template_fee: resolverConfig.template_fee };
  }

  public async estimateFee(sender: string, job: warp_controller.CreateJobMsg): Promise<Fee> {
    const accountInfo = await this.wallet.lcd.auth.accountInfo(sender);

    try {
      const fee = await this.wallet.lcd.tx.estimateFee(
        [{ sequenceNumber: accountInfo.getSequenceNumber(), publicKey: accountInfo.getPublicKey() }],
        {
          msgs: JSON.parse(job.msgs).map((msg: warp_resolver.CosmosMsgFor_Empty) =>
            cosmosMsgToCreateTxMsg(sender, msg)
          ),
          chainID: this.chain.config.chainID,
        }
      );
      return fee;
    } catch (err) {
      throw new Error('Estimate fee not possible for this job.');
    }
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
        this.chain.contracts.resolver,
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
      .execute<Extract<warp_templates.ExecuteMsg, { delete_template: {} }>>(sender, this.chain.contracts.resolver, {
        delete_template: { id: templateId },
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async editTemplate(sender: string, msg: warp_templates.EditTemplateMsg): Promise<TxInfo> {
    const txPayload = TxBuilder.new(this.chain.config)
      .execute<Extract<warp_templates.ExecuteMsg, { edit_template: {} }>>(sender, this.chain.contracts.resolver, {
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
