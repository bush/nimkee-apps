import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ServiceDemoModule } from './service-demo.module';

async function bootstrap() {

  const app = await NestFactory.create(ServiceDemoModule);
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3002,
    },
  });
  await app.startAllMicroservices();
  const port = process.env.port ?? 3000
  await app.listen(port);
  console.log(`Service A HTTP server running on port ${port}`);
}
bootstrap();
