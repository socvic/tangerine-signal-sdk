import { MicroPollsResponseError } from './errors';

export type CVJson = {
  type?: string;
  value?: unknown;
  success?: boolean;
};

export function unwrapReadOnlyResponse(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') {
    throw new MicroPollsResponseError('Invalid read-only response payload');
  }

  const maybe = raw as CVJson;
  if (typeof maybe.success === 'boolean') {
    if (!maybe.success) {
      throw new MicroPollsResponseError('Read-only call returned err response');
    }
    return maybe.value;
  }

  return maybe.value;
}

export function expectTuple(value: unknown): Record<string, CVJson> {
  if (!value || typeof value !== 'object') {
    throw new MicroPollsResponseError('Expected tuple value object');
  }

  const tuple = value as CVJson;
  if (!tuple.value || typeof tuple.value !== 'object') {
    throw new MicroPollsResponseError('Expected tuple.value object');
  }

  return tuple.value as Record<string, CVJson>;
}

export function isOptionalNone(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const optional = value as CVJson;
  if (!optional.type || !optional.type.includes('optional')) return false;
  return optional.value === null;
}

export function expectOptionalSome(value: unknown): CVJson {
  if (!value || typeof value !== 'object') {
    throw new MicroPollsResponseError('Expected optional value object');
  }

  const optional = value as CVJson;
  if (!optional.type || !optional.type.includes('optional')) {
    throw new MicroPollsResponseError('Expected optional Clarity type');
  }

  if (!optional.value || typeof optional.value !== 'object') {
    throw new MicroPollsResponseError('Expected optional some value');
  }

  return optional.value as CVJson;
}

export function asBigInt(value: unknown, fieldName: string): bigint {
  if (value && typeof value === 'object' && 'value' in value) {
    return asBigInt((value as { value: unknown }).value, fieldName);
  }
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }
  throw new MicroPollsResponseError(`Expected uint for ${fieldName}`);
}

export function asBool(value: unknown, fieldName: string): boolean {
  if (value && typeof value === 'object' && 'value' in value) {
    return asBool((value as { value: unknown }).value, fieldName);
  }
  if (typeof value === 'boolean') return value;
  throw new MicroPollsResponseError(`Expected bool for ${fieldName}`);
}

export function asString(value: unknown, fieldName: string): string {
  if (value && typeof value === 'object' && 'value' in value) {
    return asString((value as { value: unknown }).value, fieldName);
  }
  if (typeof value === 'string') return value;
  throw new MicroPollsResponseError(`Expected string for ${fieldName}`);
}
