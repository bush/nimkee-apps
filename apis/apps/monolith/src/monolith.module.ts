import { Module } from '@nestjs/common';
import { LocalEventModule, ServiceBusModule } from '@app/service-bus';
import { LocalServiceBusClient } from '@app/service-bus';
import { MonolithController } from './monolith.controller';
import { MonolithService } from './monolith.service';
import { OrdersController } from './orders/orders.controller';

const serviceBusConfig = {
  imports: [LocalEventModule],
  local: LocalServiceBusClient,
};

@Module({
  imports: [
      ServiceBusModule.register(serviceBusConfig),
  ],
  controllers: [MonolithController, OrdersController],
  providers: [MonolithService],
})
export class MonolithModule {}
