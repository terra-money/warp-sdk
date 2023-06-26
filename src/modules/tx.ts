import { warp_account, warp_controller, warp_resolver } from '../types/contracts';
import { base64encode, nativeTokenDenom, Token, TransferMsg } from '../utils';
import { CreateTxOptions } from '@terra-money/feather.js';
import { TxBuilder } from '../tx';
import Big from 'big.js';
import { JobSequenceMsgComposer } from '../composers';
import { resolveExternalInputs } from '../variables';
import { WarpSdk } from '../sdk';

export class TxModule {
  private warpSdk: WarpSdk;

  constructor(warpSdk: WarpSdk) {
    this.warpSdk = warpSdk;
  }

  public async createJob(sender: string, msg: warp_controller.CreateJobMsg): Promise<CreateTxOptions> {
    const account = await this.warpSdk.account(sender);
    const config = await this.warpSdk.config();

    const nativeDenom = await nativeTokenDenom(this.warpSdk.wallet.lcd, this.warpSdk.chainConfig.chainID);

    return TxBuilder.new(this.warpSdk.chainConfig)
      .send(account.owner, account.account, {
        [nativeDenom]: Big(msg.reward).mul(Big(config.creation_fee_percentage).add(100).div(100)).toString(),
      })
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(sender, this.warpSdk.controllerContract, {
        create_job: msg,
      })
      .build();
  }

  public async createJobSequence(sender: string, sequence: warp_controller.CreateJobMsg[]): Promise<CreateTxOptions> {
    const account = await this.warpSdk.account(sender);
    const config = await this.warpSdk.config();

    let jobSequenceMsgComposer = JobSequenceMsgComposer.new();
    let totalReward = Big(0);

    sequence.forEach((msg) => {
      totalReward = totalReward.add(Big(msg.reward));
      jobSequenceMsgComposer = jobSequenceMsgComposer.chain(msg);
    });

    const jobSequenceMsg = jobSequenceMsgComposer.compose();

    const nativeDenom = await nativeTokenDenom(this.warpSdk.wallet.lcd, this.warpSdk.chainConfig.chainID);

    return TxBuilder.new(this.warpSdk.chainConfig)
      .send(account.owner, account.account, {
        [nativeDenom]: Big(totalReward).mul(Big(config.creation_fee_percentage).add(100).div(100)).toString(),
      })
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(sender, this.warpSdk.controllerContract, {
        create_job: jobSequenceMsg,
      })
      .build();
  }

  public async deleteJob(sender: string, jobId: string): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chainConfig)
      .execute<Extract<warp_controller.ExecuteMsg, { delete_job: {} }>>(sender, this.warpSdk.controllerContract, {
        delete_job: { id: jobId },
      })
      .build();
  }

  public async updateJob(sender: string, msg: warp_controller.UpdateJobMsg): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chainConfig)
      .execute<Extract<warp_controller.ExecuteMsg, { update_job: {} }>>(sender, this.warpSdk.controllerContract, {
        update_job: msg,
      })
      .build();
  }

  public async evictJob(sender: string, jobId: string): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chainConfig)
      .execute<Extract<warp_controller.ExecuteMsg, { evict_job: {} }>>(sender, this.warpSdk.controllerContract, {
        evict_job: {
          id: jobId,
        },
      })
      .build();
  }

  public async executeJob(sender: string, jobId: string): Promise<CreateTxOptions> {
    const job = await this.warpSdk.job(jobId);

    const externalInputs = await resolveExternalInputs(job.vars);

    return TxBuilder.new(this.warpSdk.chainConfig)
      .execute<Extract<warp_controller.ExecuteMsg, { execute_job: {} }>>(sender, this.warpSdk.controllerContract, {
        execute_job: { id: job.id, external_inputs: externalInputs },
      })
      .build();
  }

  public async submitTemplate(sender: string, msg: warp_resolver.SubmitTemplateMsg): Promise<CreateTxOptions> {
    const config = await this.warpSdk.config();

    const nativeDenom = await nativeTokenDenom(this.warpSdk.wallet.lcd, this.warpSdk.chainConfig.chainID);

    return TxBuilder.new(this.warpSdk.chainConfig)
      .execute<Extract<warp_resolver.ExecuteMsg, { submit_template: {} }>>(
        sender,
        this.warpSdk.resolverContract,
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
    return TxBuilder.new(this.warpSdk.chainConfig)
      .execute<Extract<warp_resolver.ExecuteMsg, { delete_template: {} }>>(sender, this.warpSdk.resolverContract, {
        delete_template: { id: templateId },
      })
      .build();
  }

  public async editTemplate(sender: string, msg: warp_resolver.EditTemplateMsg): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chainConfig)
      .execute<Extract<warp_resolver.ExecuteMsg, { edit_template: {} }>>(sender, this.warpSdk.resolverContract, {
        edit_template: msg,
      })
      .build();
  }

  public async createAccount(sender: string, funds?: warp_controller.Fund[]): Promise<CreateTxOptions> {
    return TxBuilder.new(this.warpSdk.chainConfig)
      .execute<Extract<warp_controller.ExecuteMsg, { create_account: {} }>>(sender, this.warpSdk.controllerContract, {
        create_account: {
          funds,
        },
      })
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
      txPayload = TxBuilder.new(this.warpSdk.chainConfig)
        .execute<TransferMsg>(sender, token.token, {
          transfer: {
            amount,
            recipient: account,
          },
        })
        .build();
    } else {
      txPayload = TxBuilder.new(this.warpSdk.chainConfig)
        .send(sender, account, { [token.denom]: amount })
        .build();
    }

    return txPayload;
  }

  public async withdrawAssets(sender: string, msg: warp_account.WithdrawAssetsMsg): Promise<CreateTxOptions> {
    const { account } = await this.warpSdk.account(sender);

    const txPayload = TxBuilder.new(this.warpSdk.chainConfig)
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

      txPayload = TxBuilder.new(this.warpSdk.chainConfig)
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
      txPayload = TxBuilder.new(this.warpSdk.chainConfig)
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
