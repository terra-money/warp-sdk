export { TerraTxError } from './wallet/utils';
import { env } from 'process';
import { LCDClient, LCDClientConfig, MnemonicKey, Wallet } from '@terra-money/feather.js';
import { WarpSdk } from './sdk';
import dotenv from 'dotenv';
import { CW20Addr, CW20Token } from 'utils';

dotenv.config();

const mainnetConfig: Record<string, LCDClientConfig> = {
  'phoenix-1': {
    chainID: 'phoenix-1',
    lcd: 'https://phoenix-lcd.terra.dev',
    gasAdjustment: 1.75,
    gasPrices: { uluna: 0.15 },
    prefix: 'terra',
  },
};

const testnetConfig: Record<string, LCDClientConfig> = {
  'pisco-1': {
    lcd: 'https://pisco-lcd.terra.dev',
    chainID: 'pisco-1',
    gasAdjustment: 1.75,
    gasPrices: { uluna: 0.15 },
    prefix: 'terra',
  },
};

const lcd = new LCDClient(env.NETWORK === 'mainnet' ? mainnetConfig : testnetConfig);

const chainId = env.NETWORK === 'mainnet' ? 'phoenix-1' : 'pisco-1';

const lcdClientConfig = lcd.config[chainId];

const wallet = new Wallet(lcd, new MnemonicKey({ mnemonic: env.MNEMONIC_KEY }));

const sdk = new WarpSdk(wallet, lcd.config[chainId]);

const sender = wallet.key.accAddress(lcdClientConfig.prefix);

const orneTokenAddress = 'terra1k8k32t9fd6v5smjsnymv97sywdl2jppmlhaqw6nm63zq332jmmms9kgk26';
const depositAmount = '250000000000000'; // orne token is 6 decimals

const ORNE_TOKEN: CW20Token = {
  protocol: 'Orne',
  name: 'Orne token',
  symbol: 'ORNE',
  decimals: 6,
  type: 'cw20',
  token: orneTokenAddress as CW20Addr,
  key: orneTokenAddress,
  icon: 'https://assets.terra.dev/icon/svg/CW.svg',
};

const loop = async () => {
  const createAccountTx = await sdk.createAccount(sender);

  console.log(createAccountTx);

  const account = await sdk.account(sender);

  const depositToAccountTx = await sdk.depositToAccount(sender, account.account, ORNE_TOKEN, depositAmount);

  console.log(depositToAccountTx);
};

loop();
