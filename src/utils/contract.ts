import { LCDClient } from '@terra-money/feather.js';

export const contractQuery = async <QueryMsg extends {}, QueryResponse>(
  lcd: LCDClient,
  contractAddress: string,
  msg: QueryMsg
): Promise<QueryResponse> => {
  return await lcd.wasm.contractQuery<QueryResponse>(contractAddress, msg);
};

export type TransferMsg = {
  transfer: {
    recipient: string;
    amount: string;
  };
};

export const base64encode = (input: object): string => {
  return Buffer.from(JSON.stringify(JSON.parse(JSON.stringify(input)))).toString('base64');
};

export function base64decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64').toString()) as T;
}
