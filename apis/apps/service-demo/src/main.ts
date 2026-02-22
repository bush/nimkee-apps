import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core';
import { CustomStrategy, MicroserviceOptions, Transport } from '@nestjs/microservices';

import { remoteP2PPort } from './module.config';
import { ServiceDemoModule } from './service-demo.module';
import { SqsServer } from '@app/sns-sqs';


const localP2PPort: number = process.env.P2P_LOCAL_PORT !== undefined ?
    parseInt(process.env.P2P_LOCAL_PORT, 10) : 3001

const localOptions: MicroserviceOptions = {
  transport: Transport.TCP,
  options: { retryAttempts: 5, retryDelay: 3000, host: '127.0.0.1', port: localP2PPort },
};

async function bootstrap() {
  const app = await NestFactory.create(ServiceDemoModule);

  app.connectMicroservice<MicroserviceOptions>(localOptions);

  if (process.env.SQS_QUEUE_URL) {
    const sqsOptions: CustomStrategy = {
      strategy: new SqsServer({
        region: process.env.AWS_REGION ?? 'us-east-1',
        queueUrl: process.env.SQS_QUEUE_URL,
        endpoint: process.env.AWS_ENDPOINT_URL,
      }),
    };
    app.connectMicroservice<CustomStrategy>(sqsOptions);
    console.log(`SQS consumer connected to queue: ${process.env.SQS_QUEUE_URL}`);
  }

  await app.startAllMicroservices();
  const port = process.env.HTTP_PORT ?? 3000
  await app.listen(port);
  Logger.log(`Service A HTTP server running on port ${port}`, 'Main');
  Logger.log(`P2P local port is running on port ${localP2PPort}`, 'Main');
  Logger.log(`P2P remote port is at ${remoteP2PPort}`, 'Main');
}
bootstrap();
