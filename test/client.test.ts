import { describe, expect, it } from 'vitest';
import { Cl, cvToHex } from '@stacks/transactions';
import { MicroPollsSDK } from '../src';

describe('MicroPollsSDK', () => {
  it('builds create poll call payload', () => {
    const sdk = new MicroPollsSDK({
      contractAddress: 'SP000000000000000000002Q6VF78',
      contractName: 'micro-polls',
      network: 'mainnet',
    });

    const payload = sdk.buildCreatePoll('Which?', 'A', 'B', 'C', undefined, 42);

    expect(payload.contract).toBe('SP000000000000000000002Q6VF78.micro-polls');
    expect(payload.functionName).toBe('create-poll');
    expect(payload.functionArgs).toHaveLength(6);
    expect(payload.functionArgs[0]?.startsWith('0x')).toBe(true);
  });

  it('reads poll nonce', async () => {
    const resultHex = cvToHex(Cl.ok(Cl.uint(8)));

    const sdk = new MicroPollsSDK({
      contractAddress: 'SP000000000000000000002Q6VF78',
      contractName: 'micro-polls',
      network: 'mainnet',
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            okay: true,
            result: resultHex,
          }),
          { status: 200 },
        ),
    });

    const nonce = await sdk.getPollNonce();
    expect(nonce).toBe(8n);
  });

  it('returns null for missing poll', async () => {
    const resultHex = cvToHex(Cl.ok(Cl.none()));

    const sdk = new MicroPollsSDK({
      contractAddress: 'SP000000000000000000002Q6VF78',
      contractName: 'micro-polls',
      network: 'mainnet',
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            okay: true,
            result: resultHex,
          }),
          { status: 200 },
        ),
    });

    const poll = await sdk.getPoll(99);
    expect(poll).toBeNull();
  });
});
