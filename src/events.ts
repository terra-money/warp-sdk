export enum TerraEventKind {
  // Keep in order of execution, important for comparing before and after
  TxSubmitted,
}

export type TxSubmittedEvent = {
  kind: TerraEventKind.TxSubmitted;
  payload: {
    txHash: string;
  };
};

export type TerraEventHandler = (event: TerraEvent) => void;

export type TerraEvent = TxSubmittedEvent;
