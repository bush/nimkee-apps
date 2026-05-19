import { Module } from '@nestjs/common';
import { OrdersDirectService } from './orders-direct.service';

@Module({
  providers: [OrdersDirectService],
  exports: [OrdersDirectService],
})
export class OrdersDirectModule {}
