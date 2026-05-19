import { Module } from '@nestjs/common';
import { LocalEventModule } from '@app/service-bus';
import { OrdersController } from './orders.controller';

/**
 * Stripped-down module for the SQS Lambda consumer.
 * No Redis or external transports — SqsServer handles message dispatching.
 */
@Module({
  imports: [LocalEventModule],
  controllers: [OrdersController],
})
export class OrdersLambdaModule {}
