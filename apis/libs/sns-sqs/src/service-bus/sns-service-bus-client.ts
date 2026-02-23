import { Injectable, Logger } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SnsClientOptions } from '../interfaces/sns-sqs-options.interface';

/**
 * Implements the app-level ServiceBusClient interface using AWS SNS.
 *
 * Designed to plug directly into the existing ServiceBusModule pattern:
 *
 * ```ts
 * ServiceBusModule.register({
 *   imports: [SnsServiceBusClientModule.register({ ... })],
 *   publishers: [SnsServiceBusClient],
 * })
 * ```
 *
 * - publish(eventName, payload) → SNS Publish (fire and forget)
 * - send(eventName, payload)    → throws; use SQS request/reply infrastructure instead
 */
@Injectable()
export class SnsServiceBusClient {
  private readonly logger = new Logger(SnsServiceBusClient.name);
  private readonly snsClient: SNSClient;
  private readonly topicArn: string;

  constructor(options: SnsClientOptions) {
    this.topicArn = options.topicArn;
    this.snsClient = new SNSClient({
      region: options.region,
      ...(options.credentials && { credentials: options.credentials }),
      ...(options.endpoint && { endpoint: options.endpoint }),
    });
  }

  async publish(eventName: string, payload: unknown): Promise<void> {
    this.logger.log(`Publishing "${eventName}" to SNS`);
    await this.snsClient.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Subject: eventName,
        Message: JSON.stringify(payload),
      }),
    );
  }

  async send(_eventName: string, _payload: unknown): Promise<any> {
    throw new Error(
      'SnsServiceBusClient does not support send() (request/reply). ' +
        'Use publish() for fire-and-forget events, or implement a ' +
        'dedicated request/reply mechanism with SQS correlation IDs.',
    );
  }
}
