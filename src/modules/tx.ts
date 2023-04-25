import { warp_account, warp_controller } from '../types/contracts';
import { base64encode, LUNA, Token, TransferMsg } from '../utils';
import { CreateTxOptions } from '@terra-money/terra.js';
import { TxBuilder } from '../tx';
import Big from 'big.js';
import { JobSequenceMsgComposer } from '../composers';
import { resolveExternalInputs } from '../variables';
import { WarpSdk } from '../sdk';
import { AccountFund } from '../types';

export class TxModule {
  private warpSdk: WarpSdk;

  constructor(warpSdk: WarpSdk) {
    this.warpSdk = warpSdk;
  }

  public async createJob(sender: string, msg: warp_controller.CreateJobMsg): Promise<CreateTxOptions> {
    const account = await this.warpSdk.account(sender);
    const config = await this.warpSdk.config();

    return TxBuilder.new()
      .send(account.owner, account.account, {
        [LUNA.denom]: Big(msg.reward).mul(Big(config.creation_fee_percentage).add(100).div(100)).toString(),
      })
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(sender, this.warpSdk.contractAddress, {
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

    return TxBuilder.new()
      .send(account.owner, account.account, {
        [LUNA.denom]: Big(totalReward).mul(Big(config.creation_fee_percentage).add(100).div(100)).toString(),
      })
      .execute<Extract<warp_controller.ExecuteMsg, { create_job: {} }>>(sender, this.warpSdk.contractAddress, {
        create_job: jobSequenceMsg,
      })
      .build();
  }

  public async deleteJob(sender: string, jobId: string): Promise<CreateTxOptions> {
    return TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { delete_job: {} }>>(sender, this.warpSdk.contractAddress, {
        delete_job: { id: jobId },
      })
      .build();
  }

  public async updateJob(sender: string, msg: warp_controller.UpdateJobMsg): Promise<CreateTxOptions> {
    return TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { update_job: {} }>>(sender, this.warpSdk.contractAddress, {
        update_job: msg,
      })
      .build();
  }

  public async evictJob(sender: string, jobId: string): Promise<CreateTxOptions> {
    return TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { evict_job: {} }>>(sender, this.warpSdk.contractAddress, {
        evict_job: {
          id: jobId,
        },
      })
      .build();
  }

  public async withdrawAsset(sender: string, assetInfo: warp_controller.AssetInfo): Promise<CreateTxOptions> {
    return TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { withdraw_asset: {} }>>(sender, this.warpSdk.contractAddress, {
        withdraw_asset: {
          asset_info: assetInfo,
        },
      })
      .build();
  }

  public async executeJob(sender: string, jobId: string): Promise<CreateTxOptions> {
    const job = await this.warpSdk.job(jobId);

    const externalInputs = await resolveExternalInputs(job.vars);

    return TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { execute_job: {} }>>(sender, this.warpSdk.contractAddress, {
        execute_job: { id: job.id, external_inputs: externalInputs },
      })
      .build();
  }

  public async submitTemplate(sender: string, msg: warp_controller.SubmitTemplateMsg): Promise<CreateTxOptions> {
    const config = await this.warpSdk.config();

    return TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { submit_template: {} }>>(
        sender,
        this.warpSdk.contractAddress,
        {
          submit_template: msg,
        },
        {
          [LUNA.denom]: config.template_fee,
        }
      )
      .build();
  }

  public async deleteTemplate(sender: string, templateId: string): Promise<CreateTxOptions> {
    return TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { delete_template: {} }>>(sender, this.warpSdk.contractAddress, {
        delete_template: { id: templateId },
      })
      .build();
  }

  public async editTemplate(sender: string, msg: warp_controller.EditTemplateMsg): Promise<CreateTxOptions> {
    return TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { edit_template: {} }>>(sender, this.warpSdk.contractAddress, {
        edit_template: msg,
      })
      .build();
  }

  public async createAccount(sender: string, funds: AccountFund[] = []): Promise<CreateTxOptions> {
    const nativeFunds = funds
      .filter((f) => 'native' in f)
      .map((f) => 'native' in f && f.native) as warp_controller.Coin[];

    const cwFunds = funds.filter((f) => !('native' in f)) as warp_controller.Fund[];

    return TxBuilder.new()
      .execute<Extract<warp_controller.ExecuteMsg, { create_account: {} }>>(
        sender,
        this.warpSdk.contractAddress,
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
      txPayload = TxBuilder.new()
        .execute<TransferMsg>(sender, token.token, {
          transfer: {
            amount,
            recipient: account,
          },
        })
        .build();
    } else {
      txPayload = TxBuilder.new()
        .send(sender, account, { [token.denom]: amount })
        .build();
    }

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

      txPayload = TxBuilder.new()
        .execute<warp_account.ExecuteMsg>(sender, account, {
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
        })
        .build();
    } else {
      txPayload = TxBuilder.new()
        .execute<warp_account.ExecuteMsg>(sender, account, {
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
        })
        .build();
    }

    return txPayload;
  }
}
