
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });
  app.useGlobalPipes(new ValidationPipe());
  Logger.log(`Root Directory: ${process.cwd()}`);
  Logger.log(`NODE_ENV: ${process.env.NODE_ENV}`, "Main");
  const port = process.env.PORT ?? 3000
  Logger.log(`Server started on port: ${port}`, "Main");
  const config = new DocumentBuilder()
    .setTitle('Todo Service API')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();