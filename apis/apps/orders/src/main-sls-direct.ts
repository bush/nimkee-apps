import { NestFactory } from '@nestjs/core';
import { OrdersDirectModule } from './orders-direct.module';
import { OrdersDirectService } from './orders-direct.service';

let service: OrdersDirectService;

async function bootstrap(): Promise<OrdersDirectService> {
  const app = await NestFactory.createApplicationContext(OrdersDirectModule);
  return app.get(OrdersDirectService);
}

export const handler = async (event: { cmd: string; payload: any }) => {
  service = service ?? (await bootstrap());
  return service.dispatch(event.cmd, event.payload);
};
