export class MicroPollsSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MicroPollsSDKError';
  }
}

export class MicroPollsConfigError extends MicroPollsSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'MicroPollsConfigError';
  }
}

export class MicroPollsRequestError extends MicroPollsSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'MicroPollsRequestError';
  }
}

export class MicroPollsResponseError extends MicroPollsSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'MicroPollsResponseError';
  }
}
