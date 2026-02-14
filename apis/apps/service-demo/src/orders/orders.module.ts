import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ServiceBusModule } from '../service-bus/service-bus.module';
import { Transport } from '@nestjs/microservices';
import { LocalEventModule } from '../service-bus/local/local.module';
import { P2pServiceBusClientModule } from '../service-bus/p2p/p2p-client.module';
import { LocalEventPublisher } from '../service-bus/local/local';
import { P2pServiceBusClient } from '../service-bus/p2p/p2p-client';

import { serviceBusModule } from '../module.config';

/*
@Module({
  imports: [
    ServiceBusModule.register({
      imports: [
        LocalEventModule,
        P2pEventModule.register({
          name: 'P2P_SERVICE',
          transport: Transport.TCP,
          options: { host: '127.0.0.1', port: 3002 },
        }),
      ],
      publishers: [LocalEventPublisher, P2pEventPublisher],
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}*/



@Module({
  imports: [serviceBusModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}