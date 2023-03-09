import { warp_account, warp_controller } from 'types/contracts';
import { WalletLike, Wallet, wallet } from './wallet';
import { Condition } from 'condition';
import { contractQuery, LUNA } from 'utils';
import { TxInfo } from '@terra-money/terra.js';
import { TxBuilder } from 'tx';
import Big from 'big.js';
import { CreateJobMsg, JobSequenceMsgBuilder, jsonifyMsgs } from 'job';
import { resolveExternalInputs } from 'variables';

export class WarpSdk {
  public wallet: Wallet;
  public contractAddress: string;
  public condition: Condition;

  constructor(walletLike: WalletLike, contractAddress: string) {
    this.wallet = wallet(walletLike);
    this.contractAddress = contractAddress;
    this.condition = new Condition(this.wallet, this.contractAddress);
  }

  public async isJobActive(jobId: string): Promise<boolean> {
    const job = await this.job(jobId);
    return this.condition.resolveCond(job.condition, job.vars);
  }

  public async jobs(opts: warp_controller.QueryJobsMsg = {}): Promise<warp_controller.Job[]> {
    const { jobs } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_jobs: {} }>,
      warp_controller.JobsResponse
    >(this.wallet.lcd, this.contractAddress, { query_jobs: opts });

    return jobs;
  }

  public async job(id: string): Promise<warp_controller.Job> {
    const { job } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_job: {} }>,
      warp_controller.JobResponse
    >(this.wallet.lcd, this.contractAddress, { query_job: { id } });

    return job;
  }

  public async templates(opts: warp_controller.QueryTemplatesMsg = {}): Promise<warp_controller.Template[]> {
    const { templates } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_templates: {} }>,
      warp_controller.TemplatesResponse
    >(this.wallet.lcd, this.contractAddress, { query_templates: opts });

    return templates;
  }

  public async template(id: string): Promise<warp_controller.Template> {
    const { template } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_template: {} }>,
      warp_controller.TemplateResponse
    >(this.wallet.lcd, this.contractAddress, { query_template: { id } });

    return template;
  }

  public async simulateQuery(query: warp_controller.QueryRequestFor_String): Promise<object> {
    const { response } = await contractQuery<
      Extract<warp_controller.QueryMsg, { simulate_query: {} }>,
      warp_controller.SimulateResponse
    >(this.wallet.lcd, this.contractAddress, { simulate_query: { query } });

    return JSON.parse(response);
  }

  public async account(owner: string): Promise<warp_controller.Account> {
    const { account } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_account: {} }>,
      warp_controller.AccountResponse
    >(this.wallet.lcd, this.contractAddress, { query_account: { owner } });

    return account;
  }

  public async accounts(opts: warp_controller.QueryAccountsMsg): Promise<warp_controller.Account[]> {
    const { accounts } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_accounts: {} }>,
      warp_controller.AccountsResponse
    >(this.wallet.lcd, this.contractAddress, { query_accounts: opts });

    return accounts;
  }

  public async config(): Promise<warp_controller.Config> {
    const { config } = await contractQuery<
      Extract<warp_controller.QueryMsg, { query_config: {} }>,
      warp_controller.ConfigResponse
    >(this.wallet.lcd, this.contractAddress, { query_config: {} });

    return config;
  }

  public async createJob(sender: string, msg: CreateJobMsg): Promise<TxInfo> {
    await this.createAccountIfNotExists(sender);

    const account = await this.account(sender);
    const config = await this.config();

    const txPayload = TxBuilder.new()
      .send(account.owner, account.account, {
        [LUNA.denom]: Big(msg.reward).mul(Big(config.creation_fee_percentage).add(100).div(100)).toString(),
      })
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(sender, this.contractAddress, {
        create_job: jsonifyMsgs(msg),
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
  public async createJobSequence(sender: string, sequence: CreateJobMsg[]): Promise<TxInfo> {
    await this.createAccountIfNotExists(sender);

    const account = await this.account(sender);
    const config = await this.config();

    let jobSequenceMsgBuilder = JobSequenceMsgBuilder.new();
    let totalReward = Big(0);

    sequence.forEach((input) => {
      const msg = jsonifyMsgs(input);
      totalReward = totalReward.add(Big(msg.reward));
      jobSequenceMsgBuilder = jobSequenceMsgBuilder.chain(msg);
    });

    const jobSequenceMsg = jobSequenceMsgBuilder.build();

    const txPayload = TxBuilder.new()
      .send(account.owner, account.account, {
        [LUNA.denom]: Big(totalReward).mul(Big(config.creation_fee_percentage).add(100).div(100)).toString(),
      })
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(sender, this.contractAddress, {
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
    const txPayload = TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { delete_job: {} }>>(sender, this.contractAddress, {
        delete_job: { id: jobId },
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async updateJob(sender: string, msg: warp_controller.UpdateJobMsg): Promise<TxInfo> {
    const txPayload = TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { update_job: {} }>>(sender, this.contractAddress, {
        update_job: msg,
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async evictJob(sender: string, jobId: string): Promise<TxInfo> {
    const txPayload = TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { evict_job: {} }>>(sender, this.contractAddress, {
        evict_job: {
          id: jobId,
        },
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async executeJob(sender: string, jobId: string): Promise<TxInfo> {
    const job = await this.job(jobId);

    const txPayload = await executeJobTxPayload(sender, job);

    return this.wallet.tx(txPayload);
  }

  public async submitTemplate(sender: string, msg: warp_controller.SubmitTemplateMsg): Promise<TxInfo> {
    const config = await this.config();

    const txPayload = TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { submit_template: {} }>>(
        sender,
        this.contractAddress,
        {
          submit_template: msg,
        },
        {
          [LUNA.denom]: config.template_fee,
        }
      )
      .build();

    return this.wallet.tx(txPayload);
  }

  public async deleteTemplate(sender: string, templateId: string): Promise<TxInfo> {
    const txPayload = TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { delete_template: {} }>>(sender, this.contractAddress, {
        delete_template: { id: templateId },
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async editTemplate(sender: string, msg: warp_controller.EditTemplateMsg): Promise<TxInfo> {
    const txPayload = TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { edit_template: {} }>>(sender, this.contractAddress, {
        edit_template: msg,
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async createAccount(sender: string): Promise<TxInfo> {
    const txPayload = TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { create_account: {} }>>(sender, this.contractAddress, {
        create_account: {},
      })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async depositLunaToWarpAccount(
    sender: string,
    warpAccount: string,
    amount: warp_controller.Uint128
  ): Promise<TxInfo> {
    const txPayload = TxBuilder.new()
      .send(sender, warpAccount, { [LUNA.denom]: amount })
      .build();

    return this.wallet.tx(txPayload);
  }

  public async withdrawLunaFromWarpAccount(
    owner: string,
    receiver: string,
    amount: warp_controller.Uint128
  ): Promise<TxInfo> {
    const { account } = await this.account(owner);
    const txPayload = TxBuilder.new()
      .execute<warp_account.ExecuteMsg>(owner, account, {
        msgs: [
          {
            bank: {
              send: {
                amount: [{ denom: LUNA.denom, amount: amount.toString() }],
                to_address: receiver,
              },
            },
          },
        ],
      })
      .build();

    return this.wallet.tx(txPayload);
  }
}

async function executeJobTxPayload(sender: string, job: warp_controller.Job) {
  const externalInputs = await resolveExternalInputs(job.vars);

  return TxBuilder.new()
    .execute<Extract<warp_controller.ExecuteMsg, { execute_job: {} }>>(sender, this.contractAddress, {
      execute_job: { id: job.id, external_inputs: externalInputs },
    })
    .build();
}
