import axios from 'axios';
import dotenv from 'dotenv';
import {
  Coins,
  CreateTxOptions,
  MnemonicKey,
  MsgExecuteContract,
  WaitTxBroadcastResult,
  Wallet,
} from '@terra-money/feather.js';
import { WarpSdk } from '../sdk';
import { warp_controller } from '../types/contracts';
import { ChainName, NetworkName } from 'modules';
import fs from 'fs';

dotenv.config();

const configPath = process.argv[2];
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const lcd = WarpSdk.lcdClient({ networks: [config.NETWORK as NetworkName], chains: [config.CHAIN as ChainName] });
const lcdClientConfig = Object.values(lcd.config)[0];
const wallet = new Wallet(lcd, new MnemonicKey({ mnemonic: config.MNEMONIC_KEY, coinType: Number(config.COIN_TYPE) }));
const sdk = new WarpSdk(wallet, lcdClientConfig);

export const tryExecute = async (
  wallet: Wallet,
  msgs: MsgExecuteContract[]
): Promise<WaitTxBroadcastResult | string> => {
  const txOptions: CreateTxOptions = {
    msgs: msgs,
    chainID: lcdClientConfig.chainID,
  };

  try {
    const tx = await wallet.createAndSignTx(txOptions);

    return await wallet.lcd.tx.broadcast(tx, lcdClientConfig.chainID);
  } catch (error) {
    console.log({ error });

    if (axios.isAxiosError(error) && Boolean(error.response?.data)) {
      return `Code=${error.response.data['code']} Message=${error.response.data['message']}`;
    }

    return error.message;
  }
};

function executeMsg<T extends {}>(sender: string, contract: string, msg: T, coins?: Coins.Input) {
  return new MsgExecuteContract(sender, contract, msg, coins);
}

const createMigrateJobsMsg = (startAfter: string, limit: number) => {
  return executeMsg<Extract<warp_controller.ExecuteMsg, { migrate_finished_jobs: {} }>>(
    wallet.key.accAddress(lcdClientConfig.prefix),
    sdk.chain.contracts.controller,
    {
      migrate_finished_jobs: {
        start_after: startAfter,
        limit: limit,
      },
    }
  );
};

const loop = async () => {
  let startAfter = 0;
  const limit = 50;

  // TODO: Update to current max job id on testnet/mainnet
  const maxJobId = 1000;

  while (startAfter <= maxJobId) {
    try {
      const batchLimit = startAfter + limit > maxJobId ? maxJobId - startAfter + 1 : limit;
      const migrateMsg = createMigrateJobsMsg(startAfter.toString(), batchLimit);
      const result = await tryExecute(wallet, [migrateMsg]);
      console.log(`Migrated jobs starting from ID ${startAfter} with limit ${batchLimit}:`, result);

      startAfter += limit;
    } catch (error) {
      console.error(`Failed to migrate jobs starting from ID ${startAfter}:`, error);
      break; // Stop the loop if there is an error
    }

    console.log('Sleeping for 1 second...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('Migration process has completed.');
};

loop();
