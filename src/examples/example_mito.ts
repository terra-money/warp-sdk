import { MnemonicKey, Wallet } from '@terra-money/feather.js';
import { WarpSdk } from '../sdk';
import { cond, msg, variable, job, query, string, decimal } from '../composers';
import { ChainName, NetworkName } from 'modules';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const configPath = process.argv[2];
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const lcd = WarpSdk.lcdClient({ networks: [config.NETWORK as NetworkName], chains: [config.CHAIN as ChainName] });
const lcdClientConfig = Object.values(lcd.config)[0];
const wallet = new Wallet(lcd, new MnemonicKey({ mnemonic: config.MNEMONIC_KEY, coinType: Number(config.COIN_TYPE) }));
const sdk = new WarpSdk(wallet, lcdClientConfig);
const sender = wallet.key.accAddress(lcdClientConfig.prefix);

const vault_contract_addr = 'inj1xvlnfmq5672rmvn6576rvj389ezu9nxc9dpk8l';
const vault_strategy_denom = 'inj';

const subaccount_id = variable
  .query()
  .kind('string')
  .name('subaccount_id')
  .onInit({
    query: query.smart(vault_contract_addr, { base: { config: {} } }),
    selector: '$.config.base.subaccount_id',
  })
  .reinitialize(true)
  .compose();

const next_subaccount_available_balance = variable
  .query()
  .kind('decimal')
  .name('next_subaccount_available_balance')
  .onInit({
    query: {
      custom: JSON.stringify({
        route: 'exchange',
        query_data: {
          subaccount_deposit: {
            subaccount_id: variable.ref(subaccount_id),
            denom: vault_strategy_denom,
          },
        },
      }),
    },
    selector: '$.deposits.available_balance',
  })
  .reinitialize(true)
  .compose();

const prev_subaccount_available_balance = variable
  .static()
  .kind('decimal')
  .name('prev_subaccount_available_balance')
  .reinitialize(false)
  .onInit({
    decimal: {
      simple: '0',
    },
  })
  .onSuccess({
    decimal: {
      ref: variable.ref(next_subaccount_available_balance),
    },
  })
  .compose();

const next_config = variable
  .query()
  .kind('string')
  .name('next_config')
  .onInit({
    query: query.smart(vault_contract_addr, { base: { config: {} } }),
    selector: '$.config',
  })
  .reinitialize(true)
  .compose();

const prev_config = variable
  .static()
  .kind('string')
  .onInit({
    string: {
      simple: '',
    },
  })
  .name('prev_config')
  .reinitialize(false)
  .onSuccess({
    string: {
      ref: variable.ref(next_config),
    },
  })
  .compose();

const condition = cond.or(
  cond.decimal(decimal.ref(prev_subaccount_available_balance), 'lt', decimal.ref(next_subaccount_available_balance)),
  cond.string(string.ref(prev_config), 'neq', string.ref(next_config))
);

const executions = [
  {
    condition,
    msgs: [
      msg.execute(vault_contract_addr, {
        market_make: {},
      }),
    ],
  },
];

const recurring = false;
const durationDays = '7';
// ordered in reference order (left to right, dfs)
const vars = [
  subaccount_id,
  next_subaccount_available_balance,
  prev_subaccount_available_balance,
  next_config,
  prev_config,
];

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
      .name('mito-market-maker')
      .description('Automated market maker for mito vaults.')
      .labels([])
      .recurring(recurring)
      .reward(reward.amount.toString())
      .operationalAmount(operationalAmount.amount.toString())
      .vars(vars)
      .durationDays(durationDays)
      .executions(executions)
      .compose();

    const resp = await sdk.createJob(sender, createJobMsg, [operationalAmount]);

    console.log({ resp: JSON.stringify(resp) });
  } catch (err) {
    console.log(err);
  }
};

main();
