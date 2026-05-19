import { Callback, Context, Handler } from 'aws-lambda';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const serverlessExpress = require('@codegenie/serverless-express');
import { NestFactory } from '@nestjs/core';
import { ProxyModule } from './proxy.module';

let server: Handler;

async function bootstrap() {
  const app = await NestFactory.create(ProxyModule);
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
