import { SQSEvent, SQSHandler } from 'aws-lambda';
import { CustomStrategy, MicroserviceOptions } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { SqsServer } from '@app/sns-sqs';
import { ServiceDemoModule } from './service-demo.module';

let sqsServer: SqsServer;

async function bootstrap(): Promise<SqsServer> {
  const strategy = new SqsServer({
    region: process.env.AWS_REGION ?? 'us-east-1',
    queueUrl: process.env.SQS_QUEUE_URL ?? '',
    endpoint: process.env.AWS_ENDPOINT_URL,
    // Polling is not used in Lambda mode — set a large interval so no timer
    // fires during the function's lifetime.
    pollingIntervalMs: Number.MAX_SAFE_INTEGER,
  });

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ServiceDemoModule,
    { strategy } as CustomStrategy,
  );

  await app.listen();
  return strategy;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  sqsServer = sqsServer ?? (await bootstrap());
  await Promise.all(event.Records.map((record) => sqsServer.dispatchRecord(record)));
};
