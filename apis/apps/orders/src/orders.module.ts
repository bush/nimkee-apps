import { Module } from '@nestjs/common';
import {
  LocalEventModule,
  LocalServiceBusClient,
  RedisServiceBusClient,
  RedisServiceBusClientModule,
  ServiceBusModule,
  TransportType,
} from '@app/service-bus';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    ServiceBusModule.register({
      imports: [
        LocalEventModule,
        RedisServiceBusClientModule.register({
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        }),
      ],
      local: LocalServiceBusClient,
      transports: {
        [TransportType.REDIS]: RedisServiceBusClient,
      },
    }),
  ],
  controllers: [OrdersController],
})
export class OrdersModule {}
