import {
  Cl,
  cvToHex,
  cvToJSON,
  hexToCV,
  principalCV,
  stringUtf8CV,
  uintCV,
  type ClarityValue,
} from '@stacks/transactions';
import {
  asBigInt,
  asBool,
  asString,
  expectOptionalSome,
  expectTuple,
  isOptionalNone,
  unwrapReadOnlyResponse,
} from './parsers';
import {
  MicroPollsConfigError,
  MicroPollsRequestError,
  MicroPollsResponseError,
} from './errors';
import type {
  ContractCallPayload,
  MicroPollsSDKConfig,
  Poll,
  PollDetails,
  StacksNetwork,
} from './types';

const DEFAULT_API_BASE_BY_NETWORK: Record<StacksNetwork, string> = {
  mainnet: 'https://api.hiro.so',
  testnet: 'https://api.testnet.hiro.so',
  devnet: 'http://localhost:3999',
};

type ConnectRequest = (
  method: 'stx_callContract',
  params: {
    contract: `${string}.${string}`;
    functionName: string;
    functionArgs: string[];
    network: StacksNetwork;
    postConditionMode: 'deny' | 'allow';
    sponsored: boolean;
  },
) => Promise<unknown>;

export class MicroPollsSDK {
  private readonly contractAddress: string;
  private readonly contractName: string;
  private readonly network: StacksNetwork;
  private readonly apiBaseUrl: string;
  private readonly defaultSender: string | undefined;
  private readonly fetchFn: typeof fetch;

  constructor(config: MicroPollsSDKConfig) {
    if (!config.contractAddress || !config.contractName) {
      throw new MicroPollsConfigError('contractAddress and contractName are required');
    }

    this.contractAddress = config.contractAddress;
    this.contractName = config.contractName;
    this.network = config.network ?? 'mainnet';
    this.apiBaseUrl = (config.apiBaseUrl ?? DEFAULT_API_BASE_BY_NETWORK[this.network]).replace(/\/$/, '');
    this.defaultSender = config.defaultSender;
    this.fetchFn = config.fetchFn ?? fetch;
  }

  getContractId(): `${string}.${string}` {
    return `${this.contractAddress}.${this.contractName}`;
  }

  buildCreatePoll(
    question: string,
    opt1: string,
    opt2: string,
    opt3?: string,
    opt4?: string,
    duration: bigint | number = 50,
  ): ContractCallPayload {
    const third = opt3?.trim() ? Cl.some(stringUtf8CV(opt3.trim())) : Cl.none();
    const fourth = opt4?.trim() ? Cl.some(stringUtf8CV(opt4.trim())) : Cl.none();

    return this.buildPayload('create-poll', [
      stringUtf8CV(question),
      stringUtf8CV(opt1),
      stringUtf8CV(opt2),
      third,
      fourth,
      uintCV(duration),
    ]);
  }

  buildVote(pollId: bigint | number, optionId: bigint | number): ContractCallPayload {
    return this.buildPayload('vote', [uintCV(pollId), uintCV(optionId)]);
  }

  buildClosePoll(pollId: bigint | number): ContractCallPayload {
    return this.buildPayload('close-poll', [uintCV(pollId)]);
  }

  async requestContractCall(request: ConnectRequest, payload: ContractCallPayload): Promise<unknown> {
    return request('stx_callContract', {
      contract: payload.contract,
      functionName: payload.functionName,
      functionArgs: payload.functionArgs,
      network: payload.network,
      postConditionMode: payload.postConditionMode,
      sponsored: payload.sponsored,
    });
  }

  async getPollNonce(sender?: string): Promise<bigint> {
    const raw = await this.callReadOnly('get-poll-nonce', [], sender);
    return asBigInt(raw, 'poll-nonce');
  }

  async hasVoted(pollId: bigint | number, who: string, sender?: string): Promise<boolean> {
    const raw = await this.callReadOnly('has-voted', [uintCV(pollId), principalCV(who)], sender);
    return asBool(raw, 'has-voted');
  }

  async isPollOpen(pollId: bigint | number, sender?: string): Promise<boolean> {
    const raw = await this.callReadOnly('is-poll-open', [uintCV(pollId)], sender);
    return asBool(raw, 'is-poll-open');
  }

  async getPoll(pollId: bigint | number, sender?: string): Promise<Poll | null> {
    const raw = await this.callReadOnly('get-poll', [uintCV(pollId)], sender);
    if (isOptionalNone(raw)) return null;

    const some = expectOptionalSome(raw);
    const tuple = expectTuple(some);

    return {
      id: asBigInt(pollId, 'id'),
      creator: asString(tuple.creator?.value, 'creator'),
      question: asString(tuple.question?.value, 'question'),
      optionCount: asBigInt(tuple['option-count']?.value, 'option-count'),
      startHeight: asBigInt(tuple['start-height']?.value, 'start-height'),
      endHeight: asBigInt(tuple['end-height']?.value, 'end-height'),
      isOpen: asBool(tuple['is-open']?.value, 'is-open'),
    };
  }

  async getOption(pollId: bigint | number, optionId: bigint | number, sender?: string): Promise<string | null> {
    const raw = await this.callReadOnly('get-option', [uintCV(pollId), uintCV(optionId)], sender);
    if (isOptionalNone(raw)) return null;

    const some = expectOptionalSome(raw);
    return asString(some.value, 'option');
  }

  async getTally(pollId: bigint | number, optionId: bigint | number, sender?: string): Promise<bigint> {
    const raw = await this.callReadOnly('get-tally', [uintCV(pollId), uintCV(optionId)], sender);
    return asBigInt(raw, 'tally');
  }

  async getPollDetails(pollId: bigint | number, sender?: string): Promise<PollDetails | null> {
    const poll = await this.getPoll(pollId, sender);
    if (!poll) return null;

    const options: string[] = [];
    const tallies: bigint[] = [];

    for (let i = 1n; i <= poll.optionCount; i += 1n) {
      const [option, tally] = await Promise.all([
        this.getOption(pollId, i, sender),
        this.getTally(pollId, i, sender),
      ]);
      options.push(option ?? '');
      tallies.push(tally);
    }

    return {
      ...poll,
      options,
      tallies,
      totalVotes: tallies.reduce((sum, value) => sum + value, 0n),
    };
  }

  async listPolls(limit = 25, sender?: string): Promise<PollDetails[]> {
    const nonce = await this.getPollNonce(sender);
    const max = nonce < BigInt(limit) ? nonce : BigInt(limit);
    const ids = Array.from({ length: Number(max) }, (_, index) => nonce - BigInt(index));
    const details = await Promise.all(ids.map((id) => this.getPollDetails(id, sender)));
    return details.filter((item): item is PollDetails => item !== null);
  }

  private buildPayload(functionName: string, args: ClarityValue[]): ContractCallPayload {
    return {
      contract: this.getContractId(),
      functionName,
      functionArgs: args.map((arg) => cvToHex(arg)),
      network: this.network,
      postConditionMode: 'deny',
      sponsored: false,
    };
  }

  private async callReadOnly(functionName: string, args: ClarityValue[], sender?: string): Promise<unknown> {
    const response = await this.fetchFn(
      `${this.apiBaseUrl}/v2/contracts/call-read/${this.contractAddress}/${this.contractName}/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: sender ?? this.defaultSender ?? this.contractAddress,
          arguments: args.map((arg) => cvToHex(arg)),
        }),
      },
    );

    if (!response.ok) {
      throw new MicroPollsRequestError(`Read-only request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      okay?: boolean;
      result?: string;
      cause?: string;
    };

    if (!payload.okay || !payload.result) {
      throw new MicroPollsResponseError(payload.cause ?? 'Read-only endpoint returned invalid response');
    }

    const clarityValue = hexToCV(payload.result);
    const parsed = cvToJSON(clarityValue);
    return unwrapReadOnlyResponse(parsed);
  }
}
