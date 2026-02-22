import { Test, TestingModule } from '@nestjs/testing';
import { SnsServiceBusClient } from './sns-service-bus-client';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

jest.mock('@aws-sdk/client-sns');

const MockSNSClient = SNSClient as jest.MockedClass<typeof SNSClient>;
const MockPublishCommand = PublishCommand as jest.MockedClass<
  typeof PublishCommand
>;

describe('SnsServiceBusClient', () => {
  let client: SnsServiceBusClient;
  let mockSend: jest.Mock;

  const options = {
    region: 'us-east-1',
    topicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic',
  };

  beforeEach(async () => {
    mockSend = jest.fn().mockResolvedValue({ MessageId: 'msg-1' });
    MockSNSClient.mockImplementation(() => ({ send: mockSend }) as any);

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

      expect(mockSend).toHaveBeenCalledTimes(1);
      // Check the args passed to the PublishCommand constructor (mocked)
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
    it('should throw a not-supported error', async () => {
      await expect(client.send('order.created', {})).rejects.toThrow(
        /request\/reply/i,
      );
    });
  });
});
