import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { serviceBusModule } from '../module.config';
import { OrdersController } from './orders.controller';

@Module({
  imports: [serviceBusModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}