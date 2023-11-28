export { TerraTxError } from '../wallet/utils';
import dotenv from 'dotenv';
import { LCDClient, LCDClientConfig, MnemonicKey, Wallet } from '@terra-money/feather.js';
import { WarpSdk } from '../sdk';
import { uint, cond, msg, variable, job, query, account, ExecutionInput } from '../composers';
import { addYears } from 'date-fns';

dotenv.config();

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

const neutronRouter = 'neutron12jm24l9lr9cupufqjuxpdjnnweana4h66tsx5cl800mke26td26sq7m05p';
const neutronBurnAccount = 'neutron109ylcvevv96f48jp6slzyuq8tu85g7u4xvmz3lq4ngw7d7r4smsq5q6ap4'; //todo
const terraRecipient = 'terra10e3392r94esu5dcwcuj9tt3mw5sq48uazarhpl77hfvcplfed04qhsrfn7'; //todo
const transferChannel = 'channel-3';
const usdt = 'neutron1h6pztc3fn7h22jm60xx90tk7hln7xg8x0nazef58gqv0n4uw9vqq9khy43';
const astro = 'ibc/EFB00E728F98F0C4BBE8CA362123ACAB466EDA2826DC6837E49F4C1902F21BBA';

let swapMsg = {
  execute_swap_operations: {
    operations: [
      {
        astro_swap: {
          offer_asset_info: {
            native_token: {
              denom: 'untrn',
            },
          },
          ask_asset_info: {
            token: {
              contract_addr: usdt,
            },
          },
        },
      },
      {
        astro_swap: {
          offer_asset_info: {
            token: {
              contract_addr: usdt,
            },
          },
          ask_asset_info: {
            native_token: {
              denom: astro,
            },
          },
        },
      },
    ],
    minimum_receive: '$warp.variable.simulate_astro_amount',
  },
};

const swapVariable = variable
  .static()
  .kind('string')
  .name('swap_msg')
  .value(JSON.stringify(swapMsg))
  .encode(true)
  .compose();

const routedSwapMsg = account.msgs([
  msg.execute(neutronRouter, variable.ref(swapVariable), [
    { denom: 'untrn', amount: '$warp.variable.neutron_balance' },
  ]),
]);

const transferMsg = account.msgs([
  msg.transfer({ denom: astro, amount: '1' }, transferChannel, { timestamp: '1692915449102000000' }, terraRecipient),
]);

let simulateAstroQuery = {
  simulate_swap_operations: {
    offer_amount: '$warp.variable.neutron_balance',
    operations: [
      {
        astro_swap: {
          offer_asset_info: {
            native_token: {
              denom: 'untrn',
            },
          },
          ask_asset_info: {
            token: {
              contract_addr: 'neutron1h6pztc3fn7h22jm60xx90tk7hln7xg8x0nazef58gqv0n4uw9vqq9khy43',
            },
          },
        },
      },
      {
        astro_swap: {
          offer_asset_info: {
            token: {
              contract_addr: 'neutron1h6pztc3fn7h22jm60xx90tk7hln7xg8x0nazef58gqv0n4uw9vqq9khy43',
            },
          },
          ask_asset_info: {
            native_token: {
              denom: 'ibc/EFB00E728F98F0C4BBE8CA362123ACAB466EDA2826DC6837E49F4C1902F21BBA',
            },
          },
        },
      },
    ],
  },
};

const simulateAstroAmount = variable
  .query()
  .kind('uint')
  .name('simulate_astro_amount')
  .onInit({ query: query.smart(neutronRouter, simulateAstroQuery), selector: '$.amount' })
  .encode(false)
  .compose();

const timeoutTimestamp = variable
  .static()
  .kind('uint')
  .name('timeout_timestamp')
  .encode(false)
  .value(addYears(new Date(), 1).getTime() * 1000000 + '')
  .compose();

const untrnAmount = variable
  .query()
  .kind('uint')
  .name('neutron_balance')
  .onInit({ query: query.balance(neutronBurnAccount, 'untrn'), selector: '$.amount.amount' }) //todo: create and get burn account on neutron
  .encode(false)
  .compose();

const routedSwapVariable = variable
  .static()
  .kind('string')
  .name('routed_swap_msg')
  .value(JSON.stringify(routedSwapMsg))
  .encode(true)
  .compose();

const transferVariable = variable
  .static()
  .kind('string')
  .name('transfer_msg')
  .value(JSON.stringify(transferMsg))
  .encode(true)
  .compose();

const condition = cond.uint(uint.ref(untrnAmount), 'gt', uint.simple('10000'));

const executions: ExecutionInput[] = [
  [
    condition,
    [
      msg.execute(neutronBurnAccount, variable.ref(routedSwapVariable)),
      msg.execute(neutronBurnAccount, variable.ref(transferVariable)),
    ],
  ],
];

const recurring = true;
const durationDays = '30';
const vars = [untrnAmount, timeoutTimestamp, simulateAstroAmount, transferVariable, swapVariable, routedSwapVariable];

const estimateJobRewardMsg = job
  .estimate()
  .recurring(recurring)
  .durationDays(durationDays)
  .vars(vars)
  .executions(executions)
  .compose();

const reward = await sdk.estimateJobReward(sender, estimateJobRewardMsg);

const operationalAmount = await sdk.estimateJobFee(sender, estimateJobRewardMsg, reward.amount.toString());

const createJobMsg = job
  .create()
  .name('swap-and-send')
  .description('')
  .recurring(recurring)
  .reward(reward.amount.toString())
  .operationalAmount(operationalAmount.amount.toString())
  .vars(vars)
  .executions(executions)
  .durationDays(durationDays)
  .labels([])
  .compose();

sdk.createJob(sender, createJobMsg, [operationalAmount]).then((response) => {
  console.log(response);
});
