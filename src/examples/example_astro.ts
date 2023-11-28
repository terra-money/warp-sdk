export { TerraTxError } from '../wallet/utils';
import dotenv from 'dotenv';
import { LCDClient, LCDClientConfig, MnemonicKey, Wallet } from '@terra-money/feather.js';
import { WarpSdk } from '../sdk';
import { uint, cond, msg, variable, job, query, ExecutionInput } from '../composers';

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

const limitOrder = {
  maxSpread: 0.15,
  lunaOfferAmount: '1000000',
  astroPurchaseAmount: '9500000000',
  astroTokenContract: 'terra167dsqkh2alurx997wmycw9ydkyu54gyswe3ygmrs4lwume3vmwks8ruqnv',
};

const astroportContract = 'terra1na348k6rvwxje9jj6ftpsapfeyaejxjeq6tuzdmzysps20l6z23smnlv64';

const astroReceived = variable
  .query()
  .kind('uint')
  .name('astro_received')
  .onInit({
    query: query.smart(astroportContract, {
      simulate_swap_operations: {
        offer_amount: limitOrder.lunaOfferAmount,
        operations: [
          {
            astro_swap: {
              ask_asset_info: {
                token: {
                  contract_addr: limitOrder.astroTokenContract,
                },
              },
              offer_asset_info: {
                native_token: {
                  denom: 'uluna',
                },
              },
            },
          },
        ],
      },
    }),
    selector: '$.amount',
  })
  .compose();

const condition = cond.uint(uint.ref(astroReceived), 'gte', uint.simple(limitOrder.astroPurchaseAmount));

const executions: ExecutionInput[] = [
  [
    condition,
    [
      msg.execute(
        astroportContract,
        {
          execute_swap_operations: {
            max_spread: limitOrder.maxSpread,
            minimum_receive: limitOrder.astroPurchaseAmount,
            operations: [
              {
                astro_swap: {
                  ask_asset_info: {
                    token: {
                      contract_addr: limitOrder.astroTokenContract,
                    },
                  },
                  offer_asset_info: {
                    native_token: {
                      denom: 'uluna',
                    },
                  },
                },
              },
            ],
          },
        },
        [{ denom: 'uluna', amount: limitOrder.lunaOfferAmount }]
      ),
    ],
  ],
];

const recurring = false;
const durationDays = '30';
const vars = [astroReceived];

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
  .name('astroport-limit-order')
  .reward(reward.amount.toString())
  .operationalAmount(operationalAmount.amount.toString())
  .recurring(recurring)
  .description('This job creates an astroport limit order.')
  .labels([])
  .vars(vars)
  .durationDays(durationDays)
  .executions(executions)
  .compose();

sdk.createJob(sender, createJobMsg, [operationalAmount]).then((response) => {
  console.log(response);
});
