import { NestFactory } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersLambdaModule } from './orders-lambda.module';

let eventEmitter: EventEmitter2;

async function bootstrap(): Promise<EventEmitter2> {
  const app = await NestFactory.createApplicationContext(OrdersLambdaModule);
  return app.get(EventEmitter2);
}

export const handler = async (event: { cmd: string; payload: any }) => {
  eventEmitter = eventEmitter ?? (await bootstrap());
  // @OnMessage registers an @OnEvent listener keyed by JSON.stringify(pattern)
  const eventKey = JSON.stringify({ cmd: event.cmd });
  const results = await eventEmitter.emitAsync(eventKey, event.payload);
  return results[0];
};
