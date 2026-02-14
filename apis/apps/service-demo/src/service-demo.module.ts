import { Module } from '@nestjs/common';

import { ServiceDemoService } from './service-demo.service';
import { ServiceDemoController } from './service-demo.controller';
import { OrdersModule } from './orders/orders.module';

import { PaymentsService } from './payments/payments.service';
import { PaymentsListener } from './payments/payments.listener';

import { serviceBusModule } from './module.config';

@Module({
  imports: [
    serviceBusModule,
    OrdersModule
  ],
  controllers: [ServiceDemoController],
  providers: [ServiceDemoService, PaymentsService, PaymentsListener]
})
export class ServiceDemoModule { }


