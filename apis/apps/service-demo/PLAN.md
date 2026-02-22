# Plan: Deploy `service-demo` as a Serverless Lambda App

## Overview

Deploy the `service-demo` NestJS app as **two Lambda functions**:

- **`service-demo-http`** — API Gateway catch-all (mirrors the existing `todos` Lambda pattern)
- **`service-demo-sqs`** — SQS trigger handler (replaces the polling loop used in local/ECS deployments)

The P2P TCP transport (`P2pServiceBusClientModule`) is excluded from both Lambda functions because Lambda has no persistent TCP peer.

---

## Architecture Decisions

### Why two Lambda functions?
Lambda functions are invoked by a single event source. API Gateway delivers HTTP request events; SQS delivers batch message events (`SQSEvent { Records[] }`). These have incompatible event shapes and must be separate handler entrypoints.

### Why not reuse `SqsServer`'s polling loop?
`SqsServer` was designed for long-running polling loops. In Lambda, **AWS polls the queue on your behalf** and invokes the function with SQS records directly. We cannot run a polling loop inside a Lambda invocation. Instead we will:
1. Add a public `dispatchRecord()` method to `SqsServer` (minimal lib change)
2. Use `SqsServer` purely as a handler registry in Lambda — it registers all `@EventPattern` handlers at bootstrap, then `dispatchRecord()` routes individual SQS records to them without any polling

### P2P TCP exclusion
`P2pServiceBusClientModule` connects to `127.0.0.1:3002`. There is no TCP peer in Lambda. A `serviceBusModuleLambda` export will be added to `module.config.ts` that omits P2P and only includes Local + SNS publishers.

---

## Files to Create

| File | Purpose |
|---|---|
| `apis/apps/service-demo/src/nest-init.ts` | Shared HTTP bootstrap for Lambda; creates a `ServiceDemoLambdaModule` without P2P TCP |
| `apis/apps/service-demo/src/main-sls.ts` | HTTP Lambda entrypoint using `@codegenie/serverless-express` (mirrors `todos/main-sls.ts`) |
| `apis/apps/service-demo/src/main-sls-sqs.ts` | SQS Lambda entrypoint; bootstraps microservice app, dispatches SQS records via `dispatchRecord()` |
| `apis/serverless/service-demo/serverless.yml` | Serverless Framework config with two functions |
| `apis/serverless/service-demo/sns-sqs-permissions.yml` | IAM statements for SNS publish + SQS receive/delete |

## Files to Modify

| File | Change |
|---|---|
| `apis/libs/sns-sqs/src/server/sqs-server.ts` | Add public `dispatchRecord()` method; change `tryParseJson` to `protected` |
| `apis/apps/service-demo/src/module.config.ts` | Add `serviceBusModuleLambda` export (Local + SNS only, no P2P) |
| `apis/nest-cli.json` | Add `service-demo-sls` and `service-demo-sls-sqs` build targets |
| `apis/package.json` | Add `service-demo-sls:build` combined build script |

---

## Step-by-Step Implementation

### Step 1 — Add `dispatchRecord()` to `SqsServer`

**File:** `apis/libs/sns-sqs/src/server/sqs-server.ts`

Change `tryParseJson` from `private` to `protected`. Add a new public method:

```typescript
/**
 * Dispatches a single SQS record to the registered @EventPattern handler.
 * For use in Lambda SQS trigger handlers where AWS manages deletion on success.
 * Does NOT delete the message from SQS.
 */
public async dispatchRecord(
  body: string,
  attrs?: Record<string, { stringValue?: string }>,
): Promise<void> {
  let eventName: string | undefined;
  let payload: unknown;

  const parsed = JSON.parse(body ?? '{}');

  if (parsed.Type === 'Notification') {
    // SNS → SQS subscription format
    eventName = parsed.Subject;
    payload = this.tryParseJson(parsed.Message);
  } else {
    // Direct SQS message
    eventName = attrs?.eventName?.stringValue ?? parsed.eventName;
    payload = parsed.payload ?? parsed;
  }

  if (!eventName) {
    this.logger.warn('SQS record has no event name — skipping');
    return;
  }

  const handler = this.getHandlerByPattern(eventName);
  if (handler) {
    await handler(payload, {});
  } else {
    this.logger.warn(`No handler registered for event: "${eventName}"`);
  }
}
```

---

### Step 2 — Add `serviceBusModuleLambda` to `module.config.ts`

**File:** `apis/apps/service-demo/src/module.config.ts`

Add a second export alongside the existing one:

```typescript
export const serviceBusModuleLambda = ServiceBusModule.register({
  imports: [
    LocalEventModule,
    SnsServiceBusClientModule.register({
      region: process.env.AWS_REGION ?? 'us-east-1',
      topicArn: process.env.SNS_TOPIC_ARN ?? '',
      endpoint: process.env.AWS_ENDPOINT_URL,
    }),
  ],
  publishers: [LocalEventPublisher, SnsServiceBusClient],
});
```

---

### Step 3 — Create `nest-init.ts` (shared HTTP bootstrap)

**File:** `apis/apps/service-demo/src/nest-init.ts`

Declares a `ServiceDemoLambdaModule` inline (uses `serviceBusModuleLambda`) and bootstraps the HTTP app:

```typescript
import { Logger, Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ServiceDemoController } from './service-demo.controller';
import { ServiceDemoService } from './service-demo.service';
import { OrdersModule } from './orders/orders.module';
import { PaymentsService } from './payments/payments.service';
import { PaymentsListener } from './payments/payments.listener';
import { serviceBusModuleLambda } from './module.config';

@Module({
  imports: [serviceBusModuleLambda, OrdersModule],
  controllers: [ServiceDemoController],
  providers: [ServiceDemoService, PaymentsService, PaymentsListener],
})
class ServiceDemoLambdaModule {}

export async function nestInit() {
  Logger.log(`ENVIRONMENT: ${process.env.NODE_ENV}`, 'Nest Init');
  const app = await NestFactory.create(ServiceDemoLambdaModule, { logger: ['verbose'] });
  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder().setTitle('Service Demo API').setVersion('1.0').build();
  SwaggerModule.setup('api', app, () => SwaggerModule.createDocument(app, config));
  return app;
}
```

> **Note:** `OrdersModule` currently imports `serviceBusModule` (with P2P). NestJS's lazy `ClientProxy` means TCP connections only open when `emit()` is first called, so this won't break Lambda invocations. The P2P publisher simply won't be reachable. If strict isolation is required later, `OrdersModule` can be converted to a `register()`-style dynamic module.

---

### Step 4 — Create `main-sls.ts` (HTTP Lambda entrypoint)

**File:** `apis/apps/service-demo/src/main-sls.ts`

Mirrors `apps/todos/src/main-sls.ts` exactly:

```typescript
import { Callback, Context, Handler } from 'aws-lambda';
import serverlessExpress from '@codegenie/serverless-express';
import { nestInit } from './nest-init';

let server: Handler;

async function bootstrap() {
  const app = await nestInit();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
```

---

### Step 5 — Create `main-sls-sqs.ts` (SQS Lambda entrypoint)

**File:** `apis/apps/service-demo/src/main-sls-sqs.ts`

Bootstraps the NestJS app as a microservice (registers all `@EventPattern` handlers), then dispatches each incoming SQS record via `dispatchRecord()`:

```typescript
import { Context, SQSEvent, SQSRecord } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { CustomStrategy } from '@nestjs/microservices';
import { SqsServer } from '@app/sns-sqs';
import { ServiceDemoModule } from './service-demo.module';

let sqsServer: SqsServer | null = null;

async function bootstrap(): Promise<SqsServer> {
  // pollingIntervalMs: Number.MAX_SAFE_INTEGER ensures the polling timer
  // never fires — AWS is the poller in Lambda, not the app.
  const server = new SqsServer({
    region: process.env.AWS_REGION ?? 'us-east-1',
    queueUrl: process.env.SQS_QUEUE_URL ?? '',
    pollingIntervalMs: Number.MAX_SAFE_INTEGER,
  });

  const app = await NestFactory.createMicroservice(
    ServiceDemoModule,
    { strategy: server } as CustomStrategy,
  );
  await app.listen();
  return server;
}

export const handler = async (event: SQSEvent, _context: Context): Promise<void> => {
  if (!sqsServer) {
    sqsServer = await bootstrap();
  }
  await Promise.all(
    event.Records.map((record: SQSRecord) =>
      sqsServer!.dispatchRecord(record.body, record.messageAttributes as any),
    ),
  );
};
```

---

### Step 6 — Create `serverless.yml`

**File:** `apis/serverless/service-demo/serverless.yml`

```yaml
org: bush75
service: service-demo-serverless
frameworkVersion: "4"

custom:
  stage: ${opt:stage, self:provider.stage}
  profile:
    dev: default
    prod: default

package:
  patterns:
    - '!apps/**'
    - 'dist/apps/service-demo/**'
    - '!dist/apps/todos/**'
    - '!dist/apps/made-in-canada/**'
    - '!dist/apps/quickeat/**'
    - '!dist/apps/service-b/**'
    - '!serverless.yml'
    - '!sns-sqs-permissions.yml'

provider:
  name: aws
  runtime: nodejs20.x
  stage: dev
  region: us-east-1
  profile: ${self:custom.profile.${self:custom.stage}}
  environment:
    NODE_ENV: development
    AWS_REGION: ${self:provider.region}
    SNS_TOPIC_ARN: ${env:SNS_TOPIC_ARN, ''}
    SQS_QUEUE_URL: ${env:SQS_QUEUE_URL, ''}
    SQS_QUEUE_ARN: ${env:SQS_QUEUE_ARN, ''}
  iam:
    role:
      statements: ${file(./sns-sqs-permissions.yml)}

functions:
  service-demo-http:
    handler: dist/apps/service-demo/main-sls.handler
    events:
      - http:
          method: ANY
          path: /
      - http:
          method: ANY
          path: '{proxy+}'

  service-demo-sqs:
    handler: dist/apps/service-demo/main-sls-sqs.handler
    events:
      - sqs:
          arn: ${env:SQS_QUEUE_ARN}
          batchSize: 10
          enabled: true

plugins:
  - serverless-offline
```

---

### Step 7 — Create `sns-sqs-permissions.yml`

**File:** `apis/serverless/service-demo/sns-sqs-permissions.yml`

```yaml
- Effect: Allow
  Action:
    - sns:Publish
  Resource: "*"
- Effect: Allow
  Action:
    - sqs:ReceiveMessage
    - sqs:DeleteMessage
    - sqs:GetQueueAttributes
  Resource: ${env:SQS_QUEUE_ARN}
```

---

### Step 8 — Update `nest-cli.json`

**File:** `apis/nest-cli.json`

Add after the existing `todos-sls` entry:

```json
"service-demo-sls": {
  "type": "application",
  "root": "apps/service-demo",
  "entryFile": "main-sls",
  "sourceRoot": "apps/service-demo/src",
  "compilerOptions": {
    "tsConfigPath": "apps/service-demo/tsconfig.app.json"
  }
},
"service-demo-sls-sqs": {
  "type": "application",
  "root": "apps/service-demo",
  "entryFile": "main-sls-sqs",
  "sourceRoot": "apps/service-demo/src",
  "compilerOptions": {
    "tsConfigPath": "apps/service-demo/tsconfig.app.json"
  }
}
```

---

### Step 9 — Add build script to `package.json`

**File:** `apis/package.json`

```json
"service-demo-sls:build": "nest build service-demo-sls && nest build service-demo-sls-sqs"
```

---

## Build & Deploy Commands

```bash
# From apis/
nest build service-demo-sls
nest build service-demo-sls-sqs
# or:
npm run service-demo-sls:build

# Set env vars
export SNS_TOPIC_ARN=arn:aws:sns:us-east-1:ACCOUNT:service-demo-events
export SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/ACCOUNT/service-demo-queue
export SQS_QUEUE_ARN=arn:aws:sqs:us-east-1:ACCOUNT:service-demo-queue

# Deploy
cd serverless/service-demo
serverless deploy --stage dev
```

---

## Key Architectural Notes

1. **Warm starts** — Both handlers use module-level cached instances so `bootstrap()` only runs on Lambda cold starts.

2. **SQS polling suppression** — `pollingIntervalMs: Number.MAX_SAFE_INTEGER` prevents `SqsServer`'s timer from firing during the Lambda window. AWS is the poller, not the app.

3. **SQS deletion** — With a Lambda SQS trigger, AWS automatically deletes messages on successful handler return. `dispatchRecord()` must NOT call `DeleteMessageCommand`. If the handler throws, AWS retries the batch.

4. **`@OnEvent` vs `@EventPattern`** — `PaymentsListener` uses `@OnEvent` from `@nestjs/event-emitter` (in-process, driven by `EventEmitter2`). These work in both Lambda functions as long as `LocalEventModule` (which wraps `EventEmitterModule.forRoot()`) is in the module — which it is via `serviceBusModuleLambda`.
