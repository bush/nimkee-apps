import { SqsServer } from './sqs-server';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';

jest.mock('@aws-sdk/client-sqs');

const MockSQSClient = SQSClient as jest.MockedClass<typeof SQSClient>;

/** Flush all pending micro-tasks and promise continuations. */
const flushPromises = () => new Promise((r) => setImmediate(r));

describe('SqsServer', () => {
  let server: SqsServer;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });
    mockSend = jest.fn().mockResolvedValue({ Messages: [] });
    MockSQSClient.mockImplementation(
      () => ({ send: mockSend, destroy: jest.fn() }) as any,
    );

    server = new SqsServer({
      region: 'us-east-1',
      queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue',
      pollingIntervalMs: 1000,
      waitTimeSeconds: 0,
    });
  });

  afterEach(() => {
    server.close();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(server).toBeDefined();
  });

  it('should call listen callback', async () => {
    const callback = jest.fn();
    await server.listen(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should poll SQS after the polling interval', async () => {
    await server.listen(jest.fn());

    jest.advanceTimersByTime(1000);
    await flushPromises();

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(expect.any(ReceiveMessageCommand));
  });

  it('should stop polling after close()', async () => {
    await server.listen(jest.fn());

    jest.advanceTimersByTime(1000);
    await flushPromises();
    expect(mockSend).toHaveBeenCalledTimes(1);

    server.close();

    jest.advanceTimersByTime(5000);
    await flushPromises();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('unwrap() should return the SQSClient instance', () => {
    const sqsClient = server.unwrap<SQSClient>();
    expect(sqsClient).toBeDefined();
  });

  describe('dispatchRecord()', () => {
    let noTimerServer: SqsServer;

    beforeEach(() => {
      noTimerServer = new SqsServer({
        region: 'us-east-1',
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/000000000000/test',
        pollingIntervalMs: Number.MAX_SAFE_INTEGER,
      });
    });

    afterEach(() => {
      noTimerServer.close();
    });

    const makeRecord = (body: object, attrs: Record<string, { stringValue: string; dataType: string }> = {}): any => ({
      body: JSON.stringify(body),
      messageAttributes: attrs,
    });

    it('1.1 routes SNS notification format by Subject', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      noTimerServer.addHandler('order.created', handler);

      await noTimerServer.dispatchRecord(
        makeRecord({
          Type: 'Notification',
          Subject: 'order.created',
          Message: JSON.stringify({ id: '1' }),
        }),
      );

      expect(handler).toHaveBeenCalledWith({ id: '1' }, {});
    });

    it('1.2 routes direct SQS message via messageAttributes.eventName', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      noTimerServer.addHandler('payment.processed', handler);

      await noTimerServer.dispatchRecord(
        makeRecord({ payload: { amount: 100 } }, {
          eventName: { stringValue: 'payment.processed', dataType: 'String' },
        }),
      );

      expect(handler).toHaveBeenCalledWith({ amount: 100 }, {});
    });

    it('1.3 routes direct SQS message via body.eventName fallback', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      noTimerServer.addHandler('inventory.updated', handler);

      await noTimerServer.dispatchRecord(
        makeRecord({ eventName: 'inventory.updated', payload: { sku: 'X' } }),
      );

      expect(handler).toHaveBeenCalledWith({ sku: 'X' }, {});
    });

    it('1.4 falls back to full body as payload when no body.payload key', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      noTimerServer.addHandler('foo', handler);

      await noTimerServer.dispatchRecord(makeRecord({ eventName: 'foo', quantity: 3 }));

      expect(handler).toHaveBeenCalledWith({ eventName: 'foo', quantity: 3 }, {});
    });

    it('1.5 warns and returns when no event name is resolvable', async () => {
      const warnSpy = jest.spyOn((noTimerServer as any).logger, 'warn');

      await noTimerServer.dispatchRecord(makeRecord({}));

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('without an event name'),
      );
    });

    it('1.6 warns when no handler is registered for the event', async () => {
      const warnSpy = jest.spyOn((noTimerServer as any).logger, 'warn');

      await noTimerServer.dispatchRecord(makeRecord({ eventName: 'unknown.event' }));

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No handler registered for event:'),
      );
    });

    it('1.7 never calls DeleteMessageCommand (Lambda manages deletion)', async () => {
      noTimerServer.addHandler('order.created', jest.fn().mockResolvedValue(undefined));

      await noTimerServer.dispatchRecord(
        makeRecord({ eventName: 'order.created', payload: {} }),
      );

      const deleteCalls = (mockSend.mock.calls as any[]).filter(
        ([cmd]) => cmd instanceof DeleteMessageCommand,
      );
      expect(deleteCalls).toHaveLength(0);
    });

    it('1.8 throws on malformed JSON body', async () => {
      const badRecord: any = { body: 'not-json', messageAttributes: {} };
      await expect(noTimerServer.dispatchRecord(badRecord)).rejects.toThrow();
    });

    it('1.9 passes raw string payload when SNS Message is not valid JSON', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      noTimerServer.addHandler('order.created', handler);

      await noTimerServer.dispatchRecord(
        makeRecord({
          Type: 'Notification',
          Subject: 'order.created',
          Message: 'plain string',
        }),
      );

      expect(handler).toHaveBeenCalledWith('plain string', {});
    });
  });

  describe('message dispatching', () => {
    it('should route SNS notification format by Subject', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      server.addHandler('order.created', handler);

      mockSend.mockImplementation((cmd) => {
        if (cmd instanceof ReceiveMessageCommand) {
          return Promise.resolve({
            Messages: [
              {
                Body: JSON.stringify({
                  Type: 'Notification',
                  Subject: 'order.created',
                  Message: JSON.stringify({ id: 'ord-1' }),
                }),
                ReceiptHandle: 'receipt-1',
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      await server.listen(jest.fn());
      jest.advanceTimersByTime(1000);
      await flushPromises();

      expect(handler).toHaveBeenCalledWith({ id: 'ord-1' }, {});
      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteMessageCommand));
    });

    it('should route direct SQS message by MessageAttribute eventName', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      server.addHandler('payment.processed', handler);

      mockSend.mockImplementation((cmd) => {
        if (cmd instanceof ReceiveMessageCommand) {
          return Promise.resolve({
            Messages: [
              {
                Body: JSON.stringify({ payload: { amount: 100 } }),
                MessageAttributes: {
                  eventName: {
                    StringValue: 'payment.processed',
                    DataType: 'String',
                  },
                },
                ReceiptHandle: 'receipt-2',
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      await server.listen(jest.fn());
      jest.advanceTimersByTime(1000);
      await flushPromises();

      expect(handler).toHaveBeenCalledWith({ amount: 100 }, {});
    });

    it('should skip messages without an event name', async () => {
      mockSend.mockImplementation((cmd) => {
        if (cmd instanceof ReceiveMessageCommand) {
          return Promise.resolve({
            Messages: [{ Body: '{}', ReceiptHandle: 'receipt-3' }],
          });
        }
        return Promise.resolve({});
      });

      await server.listen(jest.fn());
      jest.advanceTimersByTime(1000);
      await flushPromises();

      const deleteCalls = (mockSend.mock.calls as any[]).filter(
        ([cmd]) => cmd instanceof DeleteMessageCommand,
      );
      expect(deleteCalls).toHaveLength(0);
    });

    it('should route by body.eventName for direct SQS messages', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      server.addHandler('inventory.updated', handler);

      mockSend.mockImplementation((cmd) => {
        if (cmd instanceof ReceiveMessageCommand) {
          return Promise.resolve({
            Messages: [
              {
                Body: JSON.stringify({
                  eventName: 'inventory.updated',
                  payload: { sku: 'ABC', qty: 5 },
                }),
                ReceiptHandle: 'receipt-4',
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      await server.listen(jest.fn());
      jest.advanceTimersByTime(1000);
      await flushPromises();

      expect(handler).toHaveBeenCalledWith({ sku: 'ABC', qty: 5 }, {});
    });
  });
});
