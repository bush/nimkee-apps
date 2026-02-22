import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import type { SQSRecord } from 'aws-lambda';
import { SqsServerOptions } from '../interfaces/sns-sqs-options.interface';

/**
 * NestJS custom transport strategy that polls an SQS queue and dispatches
 * messages to @EventPattern / @MessagePattern handlers.
 *
 * Message routing:
 * - If the SQS message body is an SNS notification (body.Type === 'Notification'),
 *   the event name is taken from body.Subject and the payload from body.Message.
 * - Otherwise, the event name comes from the MessageAttribute 'eventName'
 *   or body.eventName, and the payload from body.payload (falling back to body).
 */
export class SqsServer extends Server implements CustomTransportStrategy {
  private sqsClient: SQSClient;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly options: SqsServerOptions) {
    super();
    this.sqsClient = new SQSClient({
      region: options.region,
      ...(options.credentials && { credentials: options.credentials }),
      ...(options.endpoint && { endpoint: options.endpoint }),
    });
  }

  async listen(callback: () => void): Promise<void> {
    this.isRunning = true;
    this.scheduleNextPoll();
    callback();
  }

  // Required by NestJS 11 Server abstract class.
  // SQS polling does not expose a native event emitter, so this is a no-op.
  on<EventKey extends keyof Record<string, Function>>(
    _event: EventKey,
    _callback: Record<string, Function>[EventKey],
  ): any {}

  // Returns the underlying SQS client for direct access if needed.
  unwrap<T>(): T {
    return this.sqsClient as unknown as T;
  }

  /**
   * Dispatch a single Lambda SQSRecord through the registered handlers.
   * Unlike dispatchMessage(), this does NOT delete the message — Lambda
   * manages visibility/deletion based on the function's return value.
   * Throws on error so the Lambda runtime can signal a batch-item failure.
   */
  async dispatchRecord(record: SQSRecord): Promise<void> {
    let eventName: string | undefined;
    let payload: unknown;

    const body = JSON.parse(record.body);

    if (body.Type === 'Notification') {
      eventName = body.Subject;
      payload = this.tryParseJson(body.Message);
    } else {
      eventName =
        record.messageAttributes?.eventName?.stringValue ?? body.eventName;
      payload = body.payload ?? body;
    }

    if (!eventName) {
      this.logger.warn('Received SQS record without an event name — skipping');
      return;
    }

    const handler = this.getHandlerByPattern(eventName);
    if (handler) {
      await handler(payload, {});
    } else {
      this.logger.warn(`No handler registered for event: "${eventName}"`);
    }
  }

  close(): void {
    this.isRunning = false;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.sqsClient.destroy();
  }

  private scheduleNextPoll(): void {
    if (!this.isRunning) return;
    const intervalMs = this.options.pollingIntervalMs ?? 1000;
    this.pollingTimer = setTimeout(() => this.poll(), intervalMs);
  }

  private async poll(): Promise<void> {
    try {
      await this.processMessages();
    } catch (err) {
      this.logger.error('SQS poll error', err?.stack);
    } finally {
      this.scheduleNextPoll();
    }
  }

  private async processMessages(): Promise<void> {
    const response = await this.sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: this.options.queueUrl,
        MaxNumberOfMessages: this.options.maxMessages ?? 10,
        WaitTimeSeconds: this.options.waitTimeSeconds ?? 20,
        MessageAttributeNames: ['All'],
        AttributeNames: ['All'],
      }),
    );

    const messages = response.Messages ?? [];
    await Promise.all(messages.map((msg) => this.dispatchMessage(msg)));
  }

  private async dispatchMessage(message: Message): Promise<void> {
    try {
      let eventName: string | undefined;
      let payload: unknown;

      const body = JSON.parse(message.Body ?? '{}');

      if (body.Type === 'Notification') {
        // SNS → SQS subscription format
        eventName = body.Subject;
        payload = this.tryParseJson(body.Message);
      } else {
        // Direct SQS message
        eventName =
          message.MessageAttributes?.eventName?.StringValue ?? body.eventName;
        payload = body.payload ?? body;
      }

      if (!eventName) {
        this.logger.warn(
          'Received SQS message without an event name — skipping',
        );
        return;
      }

      const handler = this.getHandlerByPattern(eventName);
      if (handler) {
        await handler(payload, {});
      } else {
        this.logger.warn(`No handler registered for event: "${eventName}"`);
      }

      await this.sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: this.options.queueUrl,
          ReceiptHandle: message.ReceiptHandle!,
        }),
      );
    } catch (err) {
      this.logger.error(
        `Error dispatching SQS message: ${err?.message}`,
        err?.stack,
      );
    }
  }

  private tryParseJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
