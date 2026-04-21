export type StacksNetwork = 'mainnet' | 'testnet' | 'devnet';

export interface MicroPollsSDKConfig {
  contractAddress: string;
  contractName: string;
  network?: StacksNetwork;
  apiBaseUrl?: string;
  defaultSender?: string;
  fetchFn?: typeof fetch;
}

export interface ContractCallPayload {
  contract: `${string}.${string}`;
  functionName: string;
  functionArgs: string[];
  network: StacksNetwork;
  postConditionMode: 'deny' | 'allow';
  sponsored: boolean;
}

export interface Poll {
  id: bigint;
  creator: string;
  question: string;
  optionCount: bigint;
  startHeight: bigint;
  endHeight: bigint;
  isOpen: boolean;
}

export interface PollDetails extends Poll {
  options: string[];
  tallies: bigint[];
  totalVotes: bigint;
}
