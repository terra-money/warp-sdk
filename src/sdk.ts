import { warp_controller } from 'types/contracts';
import { WalletLike, Wallet, wallet } from './wallet';
import { Condition } from 'condition';
import { contractQuery, LUNA } from 'utils';
import { TxInfo } from '@terra-money/terra.js';
import { TxBuilder } from 'tx';
import Big from 'big.js';
import { JobSequenceMsgBuilder } from 'job';

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
    return this.condition.resolveCond(job.condition);
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
      Extract<warp_controller.QueryMsg, { query_resolve_job_condition: {} }>,
      warp_controller.JobResponse
    >(this.wallet.lcd, this.contractAddress, { query_resolve_job_condition: { id } });

    return job;
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

  public async createJob(sender: string, msg: warp_controller.CreateJobMsg): Promise<TxInfo> {
    const account = await this.account(sender);
    const config = await this.config();

    const txPayload = TxBuilder.new()
      .send(account.owner, account.account, {
        [LUNA.denom]: Big(msg.reward).mul(Big(config.creation_fee_percentage).add(100).div(100)).toString(),
      })
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(sender, this.contractAddress, {
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
    const account = await this.account(sender);
    const config = await this.config();

    let jobSequenceMsgBuilder = JobSequenceMsgBuilder.new();
    let totalReward = Big(0);

    sequence.forEach((msg) => {
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

  public async executeJob(sender: string, jobId: string): Promise<TxInfo> {
    const txPayload = TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { execute_job: {} }>>(sender, this.contractAddress, {
        execute_job: { id: jobId },
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
}
