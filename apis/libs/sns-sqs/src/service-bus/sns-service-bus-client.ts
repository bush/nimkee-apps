import { Injectable, Logger } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';
import { SnsClientOptions } from '../interfaces/sns-sqs-options.interface';
import { ServiceBusClient, MessagePattern } from '@app/service-bus';

/**
 * Implements the app-level ServiceBusClient interface using AWS SNS/SQS.
 *
 * - publish(eventName, payload) → SNS Publish (fire and forget)
 * - send(pattern, payload)      → SNS Publish with correlationId, then polls
 *                                  a reply SQS queue for the response
 */
@Injectable()
export class SnsServiceBusClient implements ServiceBusClient {
  private readonly logger = new Logger(SnsServiceBusClient.name);
  private readonly snsClient: SNSClient;
  private readonly sqsClient: SQSClient | null;
  private readonly topicArn: string;
  private readonly replyQueueUrl?: string;
  private readonly replyTimeoutMs: number;

  constructor(options: SnsClientOptions) {
    this.topicArn = options.topicArn;
    this.replyQueueUrl = options.replyQueueUrl;
    this.replyTimeoutMs = options.replyTimeoutMs ?? 30_000;

    const clientConfig = {
      region: options.region,
      ...(options.credentials && { credentials: options.credentials }),
      ...(options.endpoint && { endpoint: options.endpoint }),
    };

    this.snsClient = new SNSClient(clientConfig);
    this.sqsClient = options.replyQueueUrl ? new SQSClient(clientConfig) : null;
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

  async send(pattern: MessagePattern, payload: unknown): Promise<any> {
    if (!this.replyQueueUrl || !this.sqsClient) {
      throw new Error(
        'SnsServiceBusClient.send() requires replyQueueUrl to be configured.',
      );
    }

    const correlationId = randomUUID();
    const subject = JSON.stringify(pattern);

    this.logger.log(
      `Sending "${subject}" with correlationId=${correlationId}`,
    );

    await this.snsClient.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Subject: subject,
        Message: JSON.stringify(payload),
        MessageAttributes: {
          correlationId: {
            DataType: 'String',
            StringValue: correlationId,
          },
          replyQueueUrl: {
            DataType: 'String',
            StringValue: this.replyQueueUrl,
          },
        },
      }),
    );

    return this.pollForReply(correlationId);
  }

  private async pollForReply(correlationId: string): Promise<any> {
    const deadline = Date.now() + this.replyTimeoutMs;

    while (Date.now() < deadline) {
      const remainingMs = deadline - Date.now();
      const waitSeconds = Math.min(5, Math.max(1, Math.floor(remainingMs / 1000)));

      const response = await this.sqsClient!.send(
        new ReceiveMessageCommand({
          QueueUrl: this.replyQueueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: waitSeconds,
          MessageAttributeNames: ['correlationId'],
        }),
      );

      for (const message of response.Messages ?? []) {
        const msgCorrelationId =
          message.MessageAttributes?.correlationId?.StringValue;

        if (msgCorrelationId === correlationId) {
          await this.sqsClient!.send(
            new DeleteMessageCommand({
              QueueUrl: this.replyQueueUrl,
              ReceiptHandle: message.ReceiptHandle!,
            }),
          );

          try {
            return JSON.parse(message.Body ?? '{}');
          } catch {
            return message.Body;
          }
        }
      }
    }

    throw new Error(
      `Timed out waiting for reply (correlationId=${correlationId}, ` +
        `timeout=${this.replyTimeoutMs}ms)`,
    );
  }
}
