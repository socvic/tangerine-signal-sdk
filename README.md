# tangerine-signal-sdk

TypeScript SDK for interacting with the `micro-polls` Clarity contract.

## Deployed Mainnet Contract

- Contract ID: `SP2V3QE7H5D09N108CJ4QPS281Z3XAZVD87R8FJ27.micro-polls`

## Features

- Typed read-only helpers for poll metadata, options, tallies, and vote state
- Typed contract call payload builders for create/vote/close flows
- Stacks Connect compatible request helper
- Publish-ready setup with lint, typecheck, tests, and build

## Installation

```bash
npm install @praiseafk/tangerine-signal-sdk @stacks/transactions
```

## Quick start

```ts
import {
  MICRO_POLLS_CONTRACT_NAME,
  MICRO_POLLS_MAINNET_CONTRACT_ADDRESS,
  MicroPollsSDK,
} from "@praiseafk/tangerine-signal-sdk";

const sdk = new MicroPollsSDK({
  contractAddress: MICRO_POLLS_MAINNET_CONTRACT_ADDRESS,
  contractName: MICRO_POLLS_CONTRACT_NAME,
  network: "mainnet",
  apiBaseUrl: "https://api.hiro.so",
});

const nonce = await sdk.getPollNonce();
const poll = await sdk.getPollDetails(1n);
```

## Build tx payloads

```ts
const createPayload = sdk.buildCreatePoll(
  "Choose one",
  "A",
  "B",
  "C",
  undefined,
  50,
);
const votePayload = sdk.buildVote(1n, 2n);
const closePayload = sdk.buildClosePoll(1n);
```

## Execute with Stacks Connect

```ts
import { request } from "@stacks/connect";

await sdk.requestContractCall(request, votePayload);
```

## API methods

- `getPollNonce()`
- `getPoll(pollId)`
- `getOption(pollId, optionId)`
- `getTally(pollId, optionId)`
- `getPollDetails(pollId)`
- `listPolls(limit?)`
- `hasVoted(pollId, principal)`
- `isPollOpen(pollId)`

## Development

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Publish checks

```bash
npm run prepublishOnly
npm pack --dry-run
```

## Publish to npm

Before first publish, verify you are logged into the intended npm account and that package names are available.

```bash
npm login
npm run publish:dry-run
npm publish --access public
```

## License

MIT
