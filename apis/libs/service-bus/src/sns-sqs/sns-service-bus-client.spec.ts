import { Test, TestingModule } from '@nestjs/testing';
import { SnsServiceBusClient } from './sns-service-bus-client';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';

jest.mock('@aws-sdk/client-sns');
jest.mock('@aws-sdk/client-sqs');
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(),
}));

const MockSNSClient = SNSClient as jest.MockedClass<typeof SNSClient>;
const MockSQSClient = SQSClient as jest.MockedClass<typeof SQSClient>;
const MockPublishCommand = PublishCommand as jest.MockedClass<
  typeof PublishCommand
>;
const mockRandomUUID = randomUUID as jest.MockedFunction<typeof randomUUID>;

describe('SnsServiceBusClient', () => {
  let client: SnsServiceBusClient;
  let mockSnsSend: jest.Mock;

  const options = {
    region: 'us-east-1',
    topicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic',
  };

  beforeEach(async () => {
    mockSnsSend = jest.fn().mockResolvedValue({ MessageId: 'msg-1' });
    MockSNSClient.mockImplementation(() => ({ send: mockSnsSend }) as any);
    MockSQSClient.mockImplementation(() => ({ send: jest.fn() }) as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SnsServiceBusClient,
          useFactory: () => new SnsServiceBusClient(options),
        },
      ],
    }).compile();

    client = module.get<SnsServiceBusClient>(SnsServiceBusClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('publish()', () => {
    it('should construct PublishCommand with correct TopicArn, Subject and Message', async () => {
      await client.publish('order.created', { id: 'ord-1' });

      expect(mockSnsSend).toHaveBeenCalledTimes(1);
      expect(MockPublishCommand).toHaveBeenCalledWith({
        TopicArn: options.topicArn,
        Subject: 'order.created',
        Message: JSON.stringify({ id: 'ord-1' }),
      });
    });

    it('should serialise complex payloads to JSON', async () => {
      const payload = { items: [1, 2, 3], nested: { key: 'value' } };
      await client.publish('cart.updated', payload);

      const [constructorArgs] = MockPublishCommand.mock.calls[0];
      expect(JSON.parse((constructorArgs as any).Message)).toEqual(payload);
    });
  });

  describe('send()', () => {
    it('should throw when replyQueueUrl is not configured', async () => {
      await expect(
        client.send({ cmd: 'test' }, { data: 1 }),
      ).rejects.toThrow(/replyQueueUrl/);
    });

    describe('with replyQueueUrl configured', () => {
      let sendClient: SnsServiceBusClient;
      let mockSqsSend: jest.Mock;

      const replyQueueUrl =
        'https://sqs.us-east-1.amazonaws.com/123456789012/reply-queue';

      beforeEach(() => {
        mockSnsSend = jest.fn().mockResolvedValue({ MessageId: 'msg-1' });
        mockSqsSend = jest.fn();

        MockSNSClient.mockImplementation(
          () => ({ send: mockSnsSend }) as any,
        );
        MockSQSClient.mockImplementation(
          () => ({ send: mockSqsSend }) as any,
        );

        mockRandomUUID.mockReturnValue('test-correlation-id' as any);

        sendClient = new SnsServiceBusClient({
          ...options,
          replyQueueUrl,
          replyTimeoutMs: 5000,
        });
      });

      it('should publish to SNS with correlationId and replyQueueUrl attributes', async () => {
        mockSqsSend
          .mockResolvedValueOnce({
            Messages: [
              {
                MessageAttributes: {
                  correlationId: { StringValue: 'test-correlation-id' },
                },
                Body: JSON.stringify({ status: 'ok' }),
                ReceiptHandle: 'receipt-1',
              },
            ],
          })
          .mockResolvedValue({}); // DeleteMessage

        await sendClient.send({ cmd: 'process-payment' }, { amount: 100 });

        expect(MockPublishCommand).toHaveBeenCalledWith({
          TopicArn: options.topicArn,
          Subject: '{"cmd":"process-payment"}',
          Message: JSON.stringify({ amount: 100 }),
          MessageAttributes: {
            correlationId: {
              DataType: 'String',
              StringValue: 'test-correlation-id',
            },
            replyQueueUrl: {
              DataType: 'String',
              StringValue: replyQueueUrl,
            },
          },
        });
      });

      it('should return parsed response when matching reply is found', async () => {
        const expectedResponse = { status: 'ok from service-demo' };

        mockSqsSend
          .mockResolvedValueOnce({
            Messages: [
              {
                MessageAttributes: {
                  correlationId: { StringValue: 'test-correlation-id' },
                },
                Body: JSON.stringify(expectedResponse),
                ReceiptHandle: 'receipt-1',
              },
            ],
          })
          .mockResolvedValue({}); // DeleteMessage

        const result = await sendClient.send(
          { cmd: 'process-payment' },
          { amount: 100 },
        );

        expect(result).toEqual(expectedResponse);
      });

      it('should delete the matched reply message from the queue', async () => {
        mockSqsSend
          .mockResolvedValueOnce({
            Messages: [
              {
                MessageAttributes: {
                  correlationId: { StringValue: 'test-correlation-id' },
                },
                Body: JSON.stringify({ status: 'ok' }),
                ReceiptHandle: 'receipt-123',
              },
            ],
          })
          .mockResolvedValue({});

        await sendClient.send({ cmd: 'test' }, {});

        expect(mockSqsSend).toHaveBeenCalledWith(
          expect.any(DeleteMessageCommand),
        );
      });

      it('should skip non-matching messages and keep polling', async () => {
        mockSqsSend
          .mockResolvedValueOnce({
            Messages: [
              {
                MessageAttributes: {
                  correlationId: { StringValue: 'other-id' },
                },
                Body: JSON.stringify({ wrong: true }),
                ReceiptHandle: 'receipt-wrong',
              },
            ],
          })
          .mockResolvedValueOnce({
            Messages: [
              {
                MessageAttributes: {
                  correlationId: { StringValue: 'test-correlation-id' },
                },
                Body: JSON.stringify({ correct: true }),
                ReceiptHandle: 'receipt-correct',
              },
            ],
          })
          .mockResolvedValue({});

        const result = await sendClient.send({ cmd: 'test' }, {});

        expect(result).toEqual({ correct: true });
      });

      it('should time out when no matching reply is received', async () => {
        mockSqsSend.mockResolvedValue({ Messages: [] });

        const shortTimeoutClient = new SnsServiceBusClient({
          ...options,
          replyQueueUrl,
          replyTimeoutMs: 100,
        });

        await expect(
          shortTimeoutClient.send({ cmd: 'test' }, {}),
        ).rejects.toThrow(/Timed out/);
      });
    });
  });
});
