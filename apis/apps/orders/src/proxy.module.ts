import { Module } from '@nestjs/common';
import {
  LocalEventModule,
  LocalServiceBusClient,
  ServiceBusModule,
  TransportType,
} from '@app/service-bus';
import { SnsServiceBusClient, SnsServiceBusClientModule } from '@app/service-bus';
import { ProxyController } from './proxy.controller';
import { Commands } from './commands';

@Module({
  imports: [
    ServiceBusModule.register({
      imports: [
        LocalEventModule,
        SnsServiceBusClientModule.register({
          region: process.env.AWS_REGION ?? 'us-east-1',
          topicArn: process.env.SNS_TOPIC_ARN ?? '',
          replyQueueUrl: process.env.SQS_REPLY_QUEUE_URL,
          replyTimeoutMs: 25_000,
        }),
      ],
      local: LocalServiceBusClient,
      transports: { [TransportType.SNS_SQS]: SnsServiceBusClient },
      serviceMap: {
        [Commands.CREATE_ORDER]: TransportType.SNS_SQS,
        [Commands.GET_ORDER]: TransportType.SNS_SQS,
        [Commands.LIST_ORDERS]: TransportType.SNS_SQS,
      },
    }),
  ],
  controllers: [ProxyController],
})
export class ProxyModule {}
