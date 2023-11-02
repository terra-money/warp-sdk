import { LCDClient, LCDClientConfig, MnemonicKey, Wallet } from '@terra-money/feather.js';
import { WarpSdk } from '../sdk';
import { uint, cond, fn, msg, variable, job, ts } from '../composers';

const piscoLcdClientConfig: LCDClientConfig = {
  lcd: 'https://pisco-lcd.terra.dev',
  chainID: 'pisco-1',
  gasAdjustment: 1.75,
  gasPrices: { uluna: 0.15 },
  prefix: 'terra',
};

const lcd = new LCDClient({
  'pisco-1': piscoLcdClientConfig,
});

const wallet = new Wallet(lcd, new MnemonicKey({ mnemonic: '...' }));

const sdk = new WarpSdk(wallet, piscoLcdClientConfig);
const sender = wallet.key.accAddress(piscoLcdClientConfig.prefix);

const nextExecution = variable
  .static()
  .kind('uint')
  .name('next_execution')
  .value(ts.date(new Date('2023-04-10T12:30:00.000Z')))
  .onSuccess(fn.uint(uint.expr(uint.simple(ts.days(1)), 'add', uint.env('time'))))
  .onError(fn.uint(uint.expr(uint.simple(ts.hours(1)), 'add', uint.env('time'))))
  .compose();

const condition = cond.uint(uint.env('time'), 'gt', uint.ref(nextExecution));

const createJobMsg = job
  .create()
  .name('eris-harvest')
  .description('This job harvests rewards for eris protoocl vaults each day.')
  .labels([])
  .recurring(true)
  .requeueOnEvict(true)
  .reward('50000')
  .vars([nextExecution])
  .executions([
    [condition, [msg.execute('terra10788fkzah89xrdm27zkj5yvhj9x3494lxawzm5qq3vvxcqz2yzaqyd3enk', { harvest: {} })]],
  ])
  .compose();

sdk.createJob(sender, createJobMsg).then((response) => {
  console.log(response);
});
