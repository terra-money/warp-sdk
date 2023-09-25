import { warp_account, warp_controller, warp_resolver, warp_templates } from '../types/contracts';
import { base64encode, nativeTokenDenom, Token, TransferMsg, TransferNftMsg } from '../utils';
import { CreateTxOptions } from '@terra-money/feather.js';
import { TxBuilder } from '../tx';
import Big from 'big.js';
import { JobSequenceMsgComposer } from '../composers';
import { resolveExternalInputs } from '../variables';
import { WarpSdk } from '../sdk';
import { Fund, mergeFunds } from '../types/job';

export class TxModule {
  private warpSdk: WarpSdk;

  constructor(warpSdk: WarpSdk) {
    this.warpSdk = warpSdk;
  }

  public async createJob(sender: string, msg: warp_controller.CreateJobMsg, funds?: Fund[]): Promise<CreateTxOptions> {
    const nativeDenom = await nativeTokenDenom(this.warpSdk.wallet.lcd, this.warpSdk.chain.config.chainID);

    const rewardFund: Fund = { native: { denom: nativeDenom, amount: msg.reward } };
    const totalFunds = funds ? mergeFunds(funds, rewardFund) : [rewardFund];

    const createAccountTx = await this.createAccount(sender, totalFunds);

    return TxBuilder.new(this.warpSdk.chain.config)
      .tx(createAccountTx)
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(
        sender,
        this.warpSdk.chain.contracts.controller,
        {
          create_job: msg,
        }
      )
      .build();
  }

  public async createJobSequence(
    sender: string,
    sequence: warp_controller.CreateJobMsg[],
    funds?: Fund[]
  ): Promise<CreateTxOptions> {
    const nativeDenom = await nativeTokenDenom(this.warpSdk.wallet.lcd, this.warpSdk.chain.config.chainID);

    const totalReward = sequence.reduce((acc, msg) => acc.add(Big(msg.reward)), Big(0));
    const rewardFund: Fund = { native: { denom: nativeDenom, amount: totalReward.toString() } };
    const totalFunds = funds ? mergeFunds(funds, rewardFund) : [rewardFund];

    const createAccountTx = await this.createAccount(sender, totalFunds);

    let jobSequenceMsgComposer = JobSequenceMsgComposer.new();

    sequence.forEach((msg) => {
      jobSequenceMsgComposer = jobSequenceMsgComposer.chain(msg);
    });

    const jobSequenceMsg = jobSequenceMsgComposer.compose();

    return TxBuilder.new(this.warpSdk.chain.config)
      .tx(createAccountTx)
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(
        sender,
        this.warpSdk.chain.contracts.controller,
        {
          create_job: jobSequenceMsg,
        }
      )
      .build();
  }

  public async deleteJob(sender: string, jobId: string): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_controller.ExecuteMsg, { delete_job: {} }>>(
        sender,
        this.warpSdk.chain.contracts.controller,
        {
          delete_job: { id: jobId },
        }
      )
      .build();
  }

  public async updateJob(sender: string, msg: warp_controller.UpdateJobMsg): Promise<CreateTxOptions> {
    const account = await this.warpSdk.account(sender);
    const config = await this.warpSdk.config();
    const nativeDenom = await nativeTokenDenom(this.warpSdk.wallet.lcd, this.warpSdk.chain.config.chainID);

    let txBuilder = TxBuilder.new(this.warpSdk.chain.config);

    if (msg.added_reward) {
      txBuilder = txBuilder.send(account.owner, account.account, {
        [nativeDenom]: Big(msg.added_reward).mul(Big(config.creation_fee_percentage).add(100).div(100)).toString(),
      });
    }

    return txBuilder
      .execute<Extract<warp_controller.ExecuteMsg, { update_job: {} }>>(
        sender,
        this.warpSdk.chain.contracts.controller,
        {
          update_job: {
            ...msg,
          },
        }
      )
      .build();
  }

  public async evictJob(sender: string, jobId: string): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_controller.ExecuteMsg, { evict_job: {} }>>(
        sender,
        this.warpSdk.chain.contracts.controller,
        {
          evict_job: {
            id: jobId,
          },
        }
      )
      .build();
  }

  public async executeJob(sender: string, jobId: string): Promise<CreateTxOptions> {
    const job = await this.warpSdk.job(jobId);

    const externalInputs = await resolveExternalInputs(job.vars);

    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_controller.ExecuteMsg, { execute_job: {} }>>(
        sender,
        this.warpSdk.chain.contracts.controller,
        {
          execute_job: { id: job.id, external_inputs: externalInputs },
        }
      )
      .build();
  }

  public async submitTemplate(sender: string, msg: warp_templates.SubmitTemplateMsg): Promise<CreateTxOptions> {
    const config = await this.warpSdk.config();

    const nativeDenom = await nativeTokenDenom(this.warpSdk.wallet.lcd, this.warpSdk.chain.config.chainID);

    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_templates.ExecuteMsg, { submit_template: {} }>>(
        sender,
        this.warpSdk.chain.contracts.templates,
        {
          submit_template: msg,
        },
        {
          [nativeDenom]: config.template_fee,
        }
      )
      .build();
  }

  public async deleteTemplate(sender: string, templateId: string): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_templates.ExecuteMsg, { delete_template: {} }>>(
        sender,
        this.warpSdk.chain.contracts.templates,
        {
          delete_template: { id: templateId },
        }
      )
      .build();
  }

  public async executeSimulateQuery(
    sender: string,
    msg: warp_resolver.ExecuteSimulateQueryMsg
  ): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_resolver.ExecuteMsg, { execute_simulate_query: {} }>>(
        sender,
        this.warpSdk.chain.contracts.resolver,
        {
          execute_simulate_query: msg,
        }
      )
      .build();
  }

  public async executeHydrateVars(sender: string, msg: warp_resolver.ExecuteHydrateVarsMsg): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_resolver.ExecuteMsg, { execute_hydrate_vars: {} }>>(
        sender,
        this.warpSdk.chain.contracts.resolver,
        {
          execute_hydrate_vars: msg,
        }
      )
      .build();
  }

  public async executeHydrateMsgs(sender: string, msg: warp_resolver.ExecuteHydrateMsgsMsg): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_resolver.ExecuteMsg, { execute_hydrate_msgs: {} }>>(
        sender,
        this.warpSdk.chain.contracts.resolver,
        {
          execute_hydrate_msgs: msg,
        }
      )
      .build();
  }

  public async executeValidateJobCreation(
    sender: string,
    msg: warp_resolver.ExecuteValidateJobCreationMsg
  ): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_resolver.ExecuteMsg, { execute_validate_job_creation: {} }>>(
        sender,
        this.warpSdk.chain.contracts.resolver,
        {
          execute_validate_job_creation: msg,
        }
      )
      .build();
  }

  public async executeResolveCondition(
    sender: string,
    msg: warp_resolver.ExecuteResolveConditionMsg
  ): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_resolver.ExecuteMsg, { execute_resolve_condition: {} }>>(
        sender,
        this.warpSdk.chain.contracts.resolver,
        {
          execute_resolve_condition: msg,
        }
      )
      .build();
  }

  public async executeApplyVarFn(sender: string, msg: warp_resolver.ExecuteApplyVarFnMsg): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_resolver.ExecuteMsg, { execute_apply_var_fn: {} }>>(
        sender,
        this.warpSdk.chain.contracts.resolver,
        {
          execute_apply_var_fn: msg,
        }
      )
      .build();
  }

  public async editTemplate(sender: string, msg: warp_templates.EditTemplateMsg): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_templates.ExecuteMsg, { edit_template: {} }>>(
        sender,
        this.warpSdk.chain.contracts.templates,
        {
          edit_template: msg,
        }
      )
      .build();
  }

  public async createAccount(sender: string, funds?: Fund[]): Promise<CreateTxOptions> {
    let txBuilder = TxBuilder.new(this.warpSdk.chain.config);

    if (funds) {
      for (let fund of funds) {
        if ('cw20' in fund) {
          const { amount, contract_addr } = fund.cw20;

          txBuilder = txBuilder.execute<TransferMsg>(sender, contract_addr, {
            transfer: {
              amount,
              recipient: this.warpSdk.chain.contracts.controller,
            },
          });
        } else if ('cw721' in fund) {
          const { contract_addr, token_id } = fund.cw721;

          txBuilder = txBuilder.execute<TransferNftMsg>(sender, contract_addr, {
            transfer_nft: {
              token_id,
              recipient: this.warpSdk.chain.contracts.controller,
            },
          });
        }
      }
    }

    const nativeFunds = funds?.filter((fund) => 'native' in fund).map((fund) => 'native' in fund && fund.native) ?? [];
    const cwFunds = (funds?.filter((fund) => !('native' in fund)) as warp_controller.Fund[]) ?? [];

    return txBuilder
      .execute<Extract<warp_controller.ExecuteMsg, { create_account: {} }>>(
        sender,
        this.warpSdk.chain.contracts.controller,
        {
          create_account: {
            funds: cwFunds,
          },
        },
        nativeFunds.reduce((acc, curr) => ({ ...acc, [curr.denom]: curr.amount }), {})
      )
      .build();
  }

  public async depositToAccount(
    sender: string,
    account: string,
    token: Token,
    amount: string
  ): Promise<CreateTxOptions> {
    let txPayload: CreateTxOptions;

    if (token.type === 'cw20') {
      txPayload = TxBuilder.new(this.warpSdk.chain.config)
        .execute<TransferMsg>(sender, token.token, {
          transfer: {
            amount,
            recipient: account,
          },
        })
        .build();
    } else {
      txPayload = TxBuilder.new(this.warpSdk.chain.config)
        .send(sender, account, { [token.denom]: amount })
        .build();
    }

    return txPayload;
  }

  public async withdrawAssets(sender: string, msg: warp_account.WithdrawAssetsMsg): Promise<CreateTxOptions> {
    const { account } = await this.warpSdk.account(sender);

    const txPayload = TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_account.ExecuteMsg, { withdraw_assets: {} }>>(sender, account, {
        withdraw_assets: msg,
      })
      .build();

    return txPayload;
  }

  public async withdrawFromAccount(
    sender: string,
    receiver: string,
    token: Token,
    amount: string
  ): Promise<CreateTxOptions> {
    const { account } = await this.warpSdk.account(sender);
    let txPayload: CreateTxOptions;

    if (token.type === 'cw20') {
      const transferMsg = {
        transfer: {
          amount,
          recipient: receiver,
        },
      };

      txPayload = TxBuilder.new(this.warpSdk.chain.config)
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
      txPayload = TxBuilder.new(this.warpSdk.chain.config)
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

    return txPayload;
  }
}
