import {
  Coins,
  ExecuteContractProposal,
  MsgExecuteContract,
  MsgSend,
  MsgSubmitProposal,
  MsgVote,
  LCDClientConfig,
  CreateTxOptions,
} from '@terra-money/feather.js';

type Msg = MsgExecuteContract | MsgSubmitProposal | MsgVote | MsgSend;

export enum VoteOption {
  /** VOTE_OPTION_UNSPECIFIED - VOTE_OPTION_UNSPECIFIED defines a no-op vote option. */
  VOTE_OPTION_UNSPECIFIED = 0,
  /** VOTE_OPTION_YES - VOTE_OPTION_YES defines a yes vote option. */
  VOTE_OPTION_YES = 1,
  /** VOTE_OPTION_ABSTAIN - VOTE_OPTION_ABSTAIN defines an abstain vote option. */
  VOTE_OPTION_ABSTAIN = 2,
  /** VOTE_OPTION_NO - VOTE_OPTION_NO defines a no vote option. */
  VOTE_OPTION_NO = 3,
  /** VOTE_OPTION_NO_WITH_VETO - VOTE_OPTION_NO_WITH_VETO defines a no with veto vote option. */
  VOTE_OPTION_NO_WITH_VETO = 4,
  UNRECOGNIZED = -1,
}

export class TxBuilder {
  private msgs: Msg[] = [];
  private chainConfig: LCDClientConfig;

  static new(chainConfig: LCDClientConfig) {
    return new TxBuilder(chainConfig);
  }

  constructor(chainConfig: LCDClientConfig) {
    this.chainConfig = chainConfig;
  }

  execute<T extends {}>(sender: string, contract: string, msg: T, coins?: Coins.Input) {
    this.msgs = [...this.msgs, new MsgExecuteContract(sender, contract, msg, coins)];
    return this;
  }

  submitProposal<T extends {}>(
    sender: string,
    proposal: {
      title: string;
      description: string;
      run_as: string;
      contract: string;
      msg: T;
      coins?: Coins.Input;
    },
    proposalDepositCoins: Coins.Input
  ) {
    this.msgs = [
      ...this.msgs,
      new MsgSubmitProposal(
        new ExecuteContractProposal(
          proposal.title,
          proposal.description,
          proposal.run_as,
          proposal.contract,
          proposal.msg,
          proposal.coins
        ),
        proposalDepositCoins,
        sender
      ),
    ];
    return this;
  }

  hook<T extends {}>(sender: string, contract: string, token: string, amount: string, msg: T) {
    this.msgs = [
      ...this.msgs,
      new MsgExecuteContract(sender, token, {
        send: {
          contract,
          amount,
          msg: hookMsg(msg),
        },
      }),
    ];
    return this;
  }

  send(sender: string, contract: string, coins: Coins.Input) {
    this.msgs = [...this.msgs, new MsgSend(sender, contract, coins)];
    return this;
  }

  sendNft<T extends {}>(sender: string, token: string, contract: string, tokenId: string, msg: T) {
    this.msgs = [
      ...this.msgs,
      new MsgExecuteContract(sender, token, {
        send_nft: {
          contract,
          token_id: tokenId,
          msg: hookMsg(msg),
        },
      }),
    ];
    return this;
  }

  vote(sender: string, proposalId: number, option: VoteOption) {
    this.msgs = [...this.msgs, new MsgVote(proposalId, sender, option)];
    return this;
  }

  build(): CreateTxOptions {
    return { msgs: this.msgs, chainID: this.chainConfig.chainID };
  }
}

export const hookMsg = (msg: object) => {
  return Buffer.from(JSON.stringify(msg)).toString('base64');
};
