import { NestFactory } from '@nestjs/core';
import { ServiceBModule } from './service-b.module';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';


async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ServiceBModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3001,
      },
    },
  );
  await app.listen();
  console.log('Service B is listening on TCP port 3001 already');
}
bootstrap();
