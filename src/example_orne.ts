export { TerraTxError } from './wallet/utils';
import { env } from 'process';
import { base64encode } from './utils';
import { LCDClient, LCDClientConfig, MnemonicKey, Wallet } from '@terra-money/feather.js';
import { WarpSdk } from './sdk';
import dotenv from 'dotenv';
import { uint, cond, fn, msg, variable, job, ts } from './composers';

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

const nextExecution = variable
  .static()
  .kind('uint')
  .name('next_execution')
  .value(ts.date(new Date('2023-08-20T12:30:00.000Z')))
  .onSuccess(fn.uint(uint.expr(uint.simple(ts.days(1)), 'add', uint.env('time'))))
  .onError(fn.uint(uint.expr(uint.simple(ts.hours(1)), 'add', uint.env('time'))))
  .compose();

const condition = cond.uint(uint.env('time'), 'gt', uint.ref(nextExecution));

const orneTokenAddress = 'terra1k8k32t9fd6v5smjsnymv97sywdl2jppmlhaqw6nm63zq332jmmms9kgk26';
const orneDistributorContract = 'terra19p20mfnvwh9yvyr7aus3a6z6g6uk28fv4jhx9kmnc2m7krg27q2qkfenjw';
const depositAmount = '250000000000000'; // orne token is 6 decimals

const createJobMsg = job
  .create()
  .name('orne-dao--staking-rewards')
  .recurring(true)
  .requeueOnEvict(true)
  .reward('50000')
  .description('This job distributes rewards to OrneDAO stakers each day.')
  .labels([])
  .cond(condition)
  .var(nextExecution)
  .msg(
    msg.execute(orneTokenAddress, {
      send: {
        amount: depositAmount,
        contract: orneDistributorContract,
        msg: base64encode({ distribute: {} }),
      },
    })
  )
  .compose();

console.log({ createJobMsg: JSON.stringify(createJobMsg) });

const loop = async () => {
  const createJobTx = await sdk.createJob(sender, createJobMsg);

  console.log(createJobTx);
};

loop();
