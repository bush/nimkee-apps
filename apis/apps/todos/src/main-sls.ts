import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Callback, Context, Handler } from 'aws-lambda';
import serverlessExpress from '@codegenie/serverless-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


// Note: To build with this file instead of src/main.ts,
// change the entryFile property in nest-cli.json to "main-sls"

let server: Handler;
async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug'],
  });

  const config = new DocumentBuilder()
    .setTitle('Todo Service API')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  Logger.log(`Application Starting: ${process.env.NODE_ENV}`, 'Bootstrap');
  server = server ?? (await bootstrap());
  return server(event,  context, callback);
};