import { NestFactory } from '@nestjs/core';
import { OrdersLambdaModule } from './orders-lambda.module';
import { OrdersController } from './orders.controller';

let controller: OrdersController;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(OrdersLambdaModule);
  return app.get(OrdersController);
}

export const handler = async (event: { id: string }) => {
  controller = controller ?? (await bootstrap());
  return controller.getOrder(event);
};
