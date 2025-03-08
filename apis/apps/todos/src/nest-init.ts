import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export async function nestInit() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });
  app.useGlobalPipes(new ValidationPipe());
  Logger.log(`BUILD ID: ${process.env.BUILD_ID}`, "Nest Init")
  Logger.log(`NODE_ENV: ${process.env.NODE_ENV}`, "Nest Init");
  const config = new DocumentBuilder()
    .setTitle('Todo Service API')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  return app;
}