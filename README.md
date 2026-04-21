# tangerine-signal-sdk

TypeScript SDK for interacting with the `micro-polls` Clarity contract.

## Features

- Typed read-only helpers for poll metadata, options, tallies, and vote state
- Typed contract call payload builders for create/vote/close flows
- Stacks Connect compatible request helper
- Publish-ready setup with lint, typecheck, tests, and build

## Installation

```bash
npm install tangerine-signal-sdk @stacks/transactions
```

## Quick start

```ts
import { MicroPollsSDK } from "tangerine-signal-sdk";

const sdk = new MicroPollsSDK({
  contractAddress: "SP123...",
  contractName: "micro-polls",
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

Before first publish, set your npm account details in `package.json` (`author`, optional `repository`, `homepage`, and `bugs`).

```bash
npm login
npm run publish:dry-run
npm publish --access public
```

## License

MIT
