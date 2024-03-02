import { LCDClient, LCDClientConfig, MnemonicKey, Wallet } from '@terra-money/feather.js';
import { WarpSdk } from '../sdk';
import { uint, cond, fn, msg, variable, job, ts } from '../composers';

const piscoLcdClientConfig: LCDClientConfig = {
  lcd: 'https://pisco-lcd.terra.dev',
  chainID: 'pisco-1',
  gasAdjustment: 1.75,
  gasPrices: { uluna: 0.015 },
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
  .onInit({
    uint: {
      simple: ts.date(new Date('2023-04-10T12:30:00.000Z')),
    },
  })
  .onSuccess(fn.uint(uint.expr(uint.simple(ts.days(1)), 'add', uint.env('time'))))
  .onError(fn.uint(uint.expr(uint.simple(ts.hours(1)), 'add', uint.env('time'))))
  .compose();

const condition = cond.uint(uint.env('time'), 'gt', uint.ref(nextExecution));

const executions = [
  {
    condition,
    msgs: [
      msg.execute('terra1kjv3e7v7m03kk8lrjqr2j604vusxrpxadg6xjz89jucladh5m5gqqag8q7', {
        execute_simulate_query: {
          query: {
            wasm: {
              contract_info: { contract_addr: 'terra1mmsl3mxq9n8a6dgye05pn0qlup7r24e2vyjkqgpe32pv3ehjgnes0jz5nc' },
            },
          },
        },
      }),
    ],
  },
];

const recurring = true;
const durationDays = '30';
const vars = [nextExecution];

const estimateJobRewardMsg = job
  .estimate()
  .recurring(recurring)
  .durationDays(durationDays)
  .vars(vars)
  .executions(executions)
  .compose();

const main = async () => {
  try {
    const reward = await sdk.estimateJobReward(sender, estimateJobRewardMsg);

    const operationalAmount = await sdk.estimateJobFee(sender, estimateJobRewardMsg, reward.amount.toString());

    const createJobMsg = job
      .create()
      .name('warp-simulate')
      .description('This job executes a query simulation for testing purposes.')
      .labels([])
      .recurring(recurring)
      .reward(reward.amount.toString())
      .operationalAmount(operationalAmount.amount.toString())
      .vars(vars)
      .durationDays(durationDays)
      .executions(executions)
      .compose();

    console.log(JSON.stringify(createJobMsg, null, 2));
  } catch (err) {
    console.log(err);
    throw err;
  }
};

main();
