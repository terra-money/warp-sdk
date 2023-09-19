# warp-sdk

WarpSdk provides a Typescript API for interacting with warp protocol, the automation protocol for the Cosmos ecosystem. The SDK provides a simple way to interact with the warp protocol's contracts, allowing developers to perform operations such as creating and managing jobs, templates, and accounts.

## Installation

```bash
npm install -S @terra-money/warp-sdk
```


## Usage

Warp sdk provides a fluent API for building more complex payloads such as creating job and templates.

Here is an example of an harvest rewards job used by eris-protocol built using composers.
```typescript
import { LCDClient, LCDClientConfig, MnemonicKey, Wallet } from '@terra-money/feather.js';
import { uint, cond, fn, msg, variable, job, ts, WarpSdk } from '@terra-money/warp-sdk';

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

const wallet = new Wallet(lcd, new MnemonicKey({ mnemonic: '<your mnemonic here>' }));

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
  .cond(condition)
  .var(nextExecution)
  .msg(msg.execute('terra10788fkzah89xrdm27zkj5yvhj9x3494lxawzm5qq3vvxcqz2yzaqyd3enk', { harvest: {} }))
  .compose();

sdk.createJob(sender, createJobMsg).then((response) => {
  console.log(response);
});


```

## Methods

isJobActive(jobId: string): Promise<boolean>: Check if a job is active by its ID.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const jobId = 'jobId';
const isActive = await warpSdk.isJobActive(jobId);
console.log(isActive);
```

jobs(opts: QueryJobsMsg = {}): Promise<Job[]>: List jobs with optional filters.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const allJobs = await warpSdk.jobs();
console.log(allJobs);
```

job(id: string): Promise<Job>: Get a job by its ID.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const jobId = 'jobId';
const jobDetails = await warpSdk.job(jobId);
console.log(jobDetails);
```

templates(opts: QueryTemplatesMsg = {}): Promise<Template[]>: List templates with optional filters.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const allTemplates = await warpSdk.templates();
console.log(allTemplates);
```

template(id: string): Promise<Template>: Get a template by its ID.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const templateId = 'templateId';
const templateDetails = await warpSdk.template(templateId);
console.log(templateDetails);
```

simulateQuery(query: QueryRequestFor_String): Promise<object>: Simulate a query.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const query = { ... };
const queryResult = await warpSdk.simulateQuery(query);
console.log(queryResult);
```

account(owner: string): Promise<Account>: Get an account by its owner.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const accountId = 'accountId';
const accountDetails = await warpSdk.account(accountId);
console.log(accountDetails);
```

accounts(opts: QueryAccountsMsg): Promise<Account[]>: List accounts with optional filters.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const allAccounts = await warpSdk.accounts();
console.log(allAccounts);
```

config(): Promise<Config>: Get the config of the Warp Protocol.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const configInfo = await warpSdk.config();
console.log(configInfo);
```

createJob(sender: string, msg: CreateJobMsg): Promise<TxInfo>: Create a job.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);

const cosmosMsg = {
  bank: {
    send: {
      amount: [{ denom: 'uluna', amount: '100000' }],
      to_address: 'receiver address',
    },
  },
};

const msg = {
  ....,
  msgs: [JSON.stringify(cosmosMsg)],
  reward: '1000000',
  condition: {
    and: [{
      expr: {
        string: {
          left: {
            value: 'val1',
          },
          op: 'eq',
          right: {
            value: 'val1',
          },
        },
      },
    }],
  },
};

const sender = 'sender address';
const job = await warpSdk.createJob(sender, msg);
console.log(job);
```

createJobSequence(sender: string, sequence: CreateJobMsg[]): Promise<TxInfo>: Create a sequence of jobs.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);

const msg1 = {
  ...
  msgs: [...],
  reward: '1000000',
  condition: {
    and: [{
      expr: {
        string: {
          left: {
            value: 'val1',
          },
          op: 'eq',
          right: {
            value: 'val1',
          },
        },
      },
    }],
  }],
};

const msg2 = {
  ...,
  msgs: [...],
  reward: '1000000',
  condition: {
    and: [{
      expr: {
        string: {
          left: {
            value: 'val',
          },
          op: 'eq',
          right: {
            value: 'val2',
          },
        },
      },
    }],
  },
};

const sender = 'sender address';
const jobSequence = await warpSdk.createJobSequence(sender, [msg1, msg2]);
console.log(jobSequence);
```

deleteJob(sender: string, jobId: string): Promise<TxInfo>: Delete a job.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const sender = 'sender address';

const jobId = 'abc123';
const response = await warpSdk.deleteJob(sender, jobId);
console.log(response);
```

updateJob(sender: string, msg: UpdateJobMsg): Promise<TxInfo>: Update a job.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const sender = 'sender address';

const msg = { name: 'Updated Job Name', id: 'abc123' };
const response = await warpSdk.updateJob(sender, msg);
console.log(response);
```

executeJob(sender: string, jobId: string): Promise<TxInfo>: Execute a job.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const sender = 'sender address';

const jobId = 'abc123';
const response = await warpSdk.executeJob(sender, jobId);
console.log(response);
```

evictJob(sender: string, jobId: string): Promise<TxInfo>: Evict a job.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const sender = 'sender address';

const jobId = 'abc123';
const response = await warpSdk.evictJob(sender, jobId);
console.log(response);
```

submitTemplate(sender: string, msg: SubmitTemplateMsg): Promise<TxInfo>: Submit a template.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const sender = 'sender address';

const msg = { name: 'Template 1', formatted_str: 'this is a template', vars: []};
const response = await sdk.submitTemplate(sender, msg);
console.log(response);
```

deleteTemplate(sender: string, templateId: string): Promise<TxInfo>: Delete a template.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const sender = 'sender address';

const templateId = 'template_id';
const response = await sdk.deleteTemplate(sender, templateId);
console.log(response);
```

editTemplate(sender: string, msg: EditTemplateMsg): Promise<TxInfo>: Edit a template.

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);
const sender = 'sender address';

const msg = { name: 'Updated Template', id: 'template_id' };
const response = await warpSdk.editTemplate(sender, msg);
console.log(response);
```

createAccount(sender: string): Promise<TxInfo>

```typescript
const warpSdk = new WarpSdk(wallet, contractAddress);

const sender = 'sender address';
const account = await warpSdk.createAccount(sender);
console.log(account);
```
