import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ServiceDemoModule } from './service-demo.module';

const localOptions:MicroserviceOptions = {
  transport: Transport.TCP,
  options: { retryAttempts: 5, retryDelay: 3000 }
};

const remoteOptions:MicroserviceOptions = {
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3002,
    },
  };

async function bootstrap() {

  const app = await NestFactory.create(ServiceDemoModule);
  const microservice = app.connectMicroservice<MicroserviceOptions>(localOptions);
  await app.startAllMicroservices();
  const port = process.env.port ?? 3001
  await app.listen(port);
  console.log(`Service A HTTP server running on port ${port}`);
}
bootstrap();
