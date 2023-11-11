import {
  warp_controller,
  warp_job_account,
  warp_legacy_account,
  warp_resolver,
  warp_templates,
} from '../types/contracts';
import { base64encode, nativeTokenDenom, Token, TransferMsg, TransferNftMsg } from '../utils';
import { Coins, CreateTxOptions } from '@terra-money/feather.js';
import { TxBuilder } from '../tx';
import { JobSequenceMsgComposer } from '../composers';
import { resolveExternalInputs } from '../variables';
import { WarpSdk } from '../sdk';

export class TxModule {
  private warpSdk: WarpSdk;

  constructor(warpSdk: WarpSdk) {
    this.warpSdk = warpSdk;
  }

  public async createJob(
    sender: string,
    msg: warp_controller.CreateJobMsg,
    coins?: Coins.Input
  ): Promise<CreateTxOptions> {
    const transferCwToControllerTx = await this.transferCwToController(sender, msg.cw_funds ?? []);

    return TxBuilder.new(this.warpSdk.chain.config)
      .tx(transferCwToControllerTx)
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(
        sender,
        this.warpSdk.chain.contracts.controller,
        {
          create_job: msg,
        },
        coins
      )
      .build();
  }

  public async createJobSequence(
    sender: string,
    sequence: warp_controller.CreateJobMsg[],
    coins?: Coins.Input
  ): Promise<CreateTxOptions> {
    let txBuilder = TxBuilder.new(this.warpSdk.chain.config);
    let jobSequenceMsgComposer = JobSequenceMsgComposer.new();

    sequence.forEach(async (msg) => {
      jobSequenceMsgComposer = jobSequenceMsgComposer.chain(msg);
      txBuilder = txBuilder.tx(await this.transferCwToController(sender, msg.cw_funds ?? []));
    });

    const jobSequenceMsg = jobSequenceMsgComposer.compose();

    return txBuilder
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(
        sender,
        this.warpSdk.chain.contracts.controller,
        {
          create_job: jobSequenceMsg,
        },
        coins
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
    let txBuilder = TxBuilder.new(this.warpSdk.chain.config);

    return txBuilder
      .execute<Extract<warp_controller.ExecuteMsg, { update_job: {} }>>(
        sender,
        this.warpSdk.chain.contracts.controller,
        {
          update_job: msg,
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

  public async transferCwToController(sender: string, funds: warp_controller.CwFund[]): Promise<CreateTxOptions> {
    let txBuilder = TxBuilder.new(this.warpSdk.chain.config);

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

    return txBuilder.build();
  }

  public async legacyDepositToAccount(
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

  public async legacyWithdrawAssets(
    sender: string,
    msg: warp_legacy_account.WithdrawAssetsMsg
  ): Promise<CreateTxOptions> {
    const { account } = await this.warpSdk.legacyAccount(sender);

    const txPayload = TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_legacy_account.ExecuteMsg, { withdraw_assets: {} }>>(sender, account, {
        withdraw_assets: msg,
      })
      .build();

    return txPayload;
  }

  public async withdrawAssets(
    sender: string,
    job_id: string,
    msg: warp_job_account.WithdrawAssetsMsg
  ): Promise<CreateTxOptions> {
    const job = await this.warpSdk.job(job_id);

    const txPayload = TxBuilder.new(this.warpSdk.chain.config)
      .execute<Extract<warp_job_account.ExecuteMsg, { withdraw_assets: {} }>>(sender, job.account, {
        withdraw_assets: msg,
      })
      .build();

    return txPayload;
  }

  public async legacyWithdrawFromAccount(
    sender: string,
    receiver: string,
    token: Token,
    amount: string
  ): Promise<CreateTxOptions> {
    const { account } = await this.warpSdk.legacyAccount(sender);
    let txPayload: CreateTxOptions;

    if (token.type === 'cw20') {
      const transferMsg = {
        transfer: {
          amount,
          recipient: receiver,
        },
      };

      txPayload = TxBuilder.new(this.warpSdk.chain.config)
        .execute<warp_legacy_account.ExecuteMsg>(sender, account, {
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
        .execute<warp_legacy_account.ExecuteMsg>(sender, account, {
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
