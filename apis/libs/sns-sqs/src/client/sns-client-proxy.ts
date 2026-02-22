import { Logger } from '@nestjs/common';
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SnsClientOptions } from '../interfaces/sns-sqs-options.interface';

/**
 * NestJS ClientProxy implementation that publishes events to AWS SNS.
 *
 * - emit(pattern, data)  → SNS Publish with Subject=pattern, Message=JSON(data)
 * - send(pattern, data)  → not supported (request/reply over SNS requires additional
 *                          infrastructure such as a correlation-ID reply queue)
 *
 * Register in a module via ClientsModule.register() with transport: Transport.CUSTOM
 * and customClass: SnsClientProxy, or use SnsServiceBusClientModule for the simpler
 * ServiceBusClient interface.
 */
export class SnsClientProxy extends ClientProxy {
  protected readonly logger = new Logger(SnsClientProxy.name);
  private snsClient: SNSClient;

  constructor(private readonly options: SnsClientOptions) {
    super();
    this.snsClient = new SNSClient({
      region: options.region,
      ...(options.credentials && { credentials: options.credentials }),
      ...(options.endpoint && { endpoint: options.endpoint }),
    });
  }

  async connect(): Promise<void> {
    // SNS is a stateless HTTP API — no persistent connection is needed.
  }

  async close(): Promise<void> {
    this.snsClient.destroy();
  }

  /**
   * Fire-and-forget: publish an event to the SNS topic.
   * The SNS Subject is set to the stringified pattern so downstream SQS
   * consumers can route by event name.
   */
  protected async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
    const { pattern, data } = packet;
    const subject =
      typeof pattern === 'string' ? pattern : JSON.stringify(pattern);

    await this.snsClient.send(
      new PublishCommand({
        TopicArn: this.options.topicArn,
        Subject: subject,
        Message: JSON.stringify(data),
      }),
    );
  }

  /**
   * Request/reply is not supported over SNS.
   * Implementing it would require a correlation-ID reply queue (e.g. SQS temporary
   * queue per request), which is out of scope for this transport.
   */
  protected publish(
    _packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): () => void {
    callback({
      err: new Error(
        'SnsClientProxy does not support send() (request/reply). Use emit() for fire-and-forget events.',
      ),
    });
    return () => {};
  }
}
