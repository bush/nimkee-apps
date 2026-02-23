import { DynamicModule, Module } from '@nestjs/common';
import { SnsServiceBusClient } from './sns-service-bus-client';
import { SnsClientOptions } from '../interfaces/sns-sqs-options.interface';

/**
 * Wraps SnsServiceBusClient as a NestJS provider so it can be injected
 * into ServiceBusModule.register({ imports: [...], publishers: [...] }).
 *
 * Usage:
 * ```ts
 * ServiceBusModule.register({
 *   imports: [
 *     SnsServiceBusClientModule.register({
 *       region: 'us-east-1',
 *       topicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic',
 *     }),
 *   ],
 *   publishers: [SnsServiceBusClient],
 * })
 * ```
 */
@Module({})
export class SnsServiceBusClientModule {
  static register(options: SnsClientOptions): DynamicModule {
    return {
      module: SnsServiceBusClientModule,
      providers: [
        {
          provide: SnsServiceBusClient,
          useFactory: () => new SnsServiceBusClient(options),
        },
      ],
      exports: [SnsServiceBusClient],
    };
  }
}
