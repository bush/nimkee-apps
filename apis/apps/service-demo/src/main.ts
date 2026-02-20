import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { remoteP2PPort } from './module.config';
import { ServiceDemoModule } from './service-demo.module';


const localP2PPort: number = process.env.P2P_LOCAL_PORT !== undefined ?
    parseInt(process.env.P2P_LOCAL_PORT, 10) : 3001

const localOptions:MicroserviceOptions = {
  transport: Transport.TCP,
  options: { retryAttempts: 5, retryDelay: 3000, host: '127.0.0.1', port: localP2PPort },
};

async function bootstrap() {
  const app = await NestFactory.create(ServiceDemoModule);
  const microservice = app.connectMicroservice<MicroserviceOptions>(localOptions);
  await app.startAllMicroservices();
  const port = process.env.HTTP_PORT ?? 3000
  await app.listen(port);
  Logger.log(`Service A HTTP server running on port ${port}`, 'Main');
  Logger.log(`P2P local port is running on port ${localP2PPort}`, 'Main');
  Logger.log(`P2P remote port is at ${remoteP2PPort}`, 'Main');
}
bootstrap();
