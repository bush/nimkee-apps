import { NestFactory } from '@nestjs/core';
import { CustomStrategy, MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ServiceDemoModule } from './service-demo.module';
import { SqsServer } from '@app/sns-sqs';

const localOptions: MicroserviceOptions = {
  transport: Transport.TCP,
  options: { retryAttempts: 5, retryDelay: 3000, host: '127.0.0.1', port: 3001 }
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
  const port = process.env.port ?? 3000;
  await app.listen(port);
  console.log(`Service A HTTP server running on port ${port}`);
}
bootstrap();
