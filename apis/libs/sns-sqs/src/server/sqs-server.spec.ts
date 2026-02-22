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
