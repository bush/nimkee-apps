jest.mock('@nestjs/core', () => ({
  NestFactory: { createMicroservice: jest.fn() },
}));
jest.mock('@app/sns-sqs', () => ({
  SqsServer: jest.fn(),
}));
// Prevent the full NestJS module tree (and its side-effectful module.config.ts
// evaluation) from loading during unit tests.
jest.mock('./service-demo.module', () => ({
  ServiceDemoModule: class ServiceDemoModule {},
}));

describe('main-sls-sqs SQS Lambda handler', () => {
  let handler: (event: any) => Promise<void>;
  let mockDispatchRecord: jest.Mock;
  let mockListen: jest.Mock;
  let mockCreateMicroservice: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    mockDispatchRecord = jest.fn().mockResolvedValue(undefined);
    mockListen = jest.fn().mockResolvedValue(undefined);
    mockCreateMicroservice = jest.fn().mockResolvedValue({ listen: mockListen });

    jest.mock('@nestjs/core', () => ({
      NestFactory: { createMicroservice: mockCreateMicroservice },
    }));
    jest.mock('@app/sns-sqs', () => ({
      SqsServer: jest.fn().mockImplementation(() => ({
        dispatchRecord: mockDispatchRecord,
        close: jest.fn(),
        listen: mockListen,
      })),
    }));
    jest.mock('./service-demo.module', () => ({
      ServiceDemoModule: class ServiceDemoModule {},
    }));

    handler = require('./main-sls-sqs').handler;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const makeRecord = (body: object) => ({
    body: JSON.stringify(body),
    messageAttributes: {},
  });

  it('3.1 bootstrap() is called once on first invocation', async () => {
    await handler({ Records: [makeRecord({ eventName: 'test' })] });
    expect(mockCreateMicroservice).toHaveBeenCalledTimes(1);
  });

  it('3.2 sqsServer is reused on subsequent invocations (warm start)', async () => {
    await handler({ Records: [makeRecord({ eventName: 'test' })] });
    await handler({ Records: [makeRecord({ eventName: 'test' })] });
    expect(mockCreateMicroservice).toHaveBeenCalledTimes(1);
  });

  it('3.3 dispatchRecord is called once per SQS record', async () => {
    await handler({
      Records: [
        makeRecord({ eventName: 'a' }),
        makeRecord({ eventName: 'b' }),
        makeRecord({ eventName: 'c' }),
      ],
    });
    expect(mockDispatchRecord).toHaveBeenCalledTimes(3);
  });

  it('3.4 each call passes the correct record', async () => {
    const records = [
      makeRecord({ eventName: 'order.created', payload: { id: 1 } }),
      makeRecord({ eventName: 'order.shipped', payload: { id: 2 } }),
    ];

    await handler({ Records: records });

    expect(mockDispatchRecord).toHaveBeenNthCalledWith(1, records[0]);
    expect(mockDispatchRecord).toHaveBeenNthCalledWith(2, records[1]);
  });

  it('3.5 all records are dispatched concurrently (Promise.all)', async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const started: number[] = [];

    mockDispatchRecord.mockImplementation(async () => {
      started.push(Date.now());
      await delay(20);
    });

    const start = Date.now();
    await handler({
      Records: [
        makeRecord({ eventName: 'a' }),
        makeRecord({ eventName: 'b' }),
        makeRecord({ eventName: 'c' }),
      ],
    });
    const elapsed = Date.now() - start;

    // Sequential would take ≥ 60ms; concurrent should finish well under that.
    expect(elapsed).toBeLessThan(60);
    expect(started).toHaveLength(3);
  });

  it('3.6 handler resolves successfully for a valid event', async () => {
    await expect(
      handler({ Records: [makeRecord({ eventName: 'order.created' })] }),
    ).resolves.toBeUndefined();
  });
});
