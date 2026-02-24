# @app/sns-sqs

NestJS transport library for AWS SNS/SQS supporting both fire-and-forget (`publish`) and request/reply (`send`) patterns.

## Architecture

```
                            AWS Cloud (us-east-1)
+-----------------------------------------------------------------------------+
|                                                                             |
|  +--------------+     +---------------------------------------------------+ |
|  |  API Gateway  |     |         service-demo Lambda (HTTP)                | |
|  |              |---->|  main-sls.handler                                 | |
|  |  POST /send  |     |                                                   | |
|  |  POST /orders|     |  +---------------------------------------------+  | |
|  +--------------+     |  | ServiceBusService                           |  | |
|                       |  |                                             |  | |
|                       |  |  publish("order.created", data)             |  | |
|                       |  |    -> fans out to ALL transports            |  | |
|                       |  |                                             |  | |
|                       |  |  send({cmd:"process-payment"}, data)        |  | |
|                       |  |    -> serviceMap routes to SNS_SQS          |  | |
|                       |  +------------------+--------------------------+  | |
|                       |                     |                            | |
|                       |  +------------------v--------------------------+  | |
|                       |  | LocalServiceBusClient  (EventEmitter2)      |  | |
|                       |  |  . @OnEvent handlers fire in-process        |  | |
|                       |  |  . PaymentsListener receives locally        |  | |
|                       |  +---------------------------------------------+  | |
|                       |                     |                            | |
|                       |  +------------------v--------------------------+  | |
|                       |  | SnsServiceBusClient                         |  | |
|                       |  |                                             |  | |
|                       |  |  publish(): SNS Publish (fire & forget)     |  | |
|                       |  |    Subject = "order.created"                |  | |
|                       |  |                                             |  | |
|                       |  |  send(): SNS Publish + poll for reply       |  | |
|                       |  |    Subject = '{"cmd":"process-payment"}'    |  | |
|                       |  |    MessageAttributes:                       |  | |
|                       |  |      correlationId = <uuid>                 |  | |
|                       |  |      replyQueueUrl = <reply queue>          |  | |
|                       |  +------+----------------------^---------------+  | |
|                       +---------|----------------------|------------------+ |
|                                 |                      |                    |
|                         1. publish/send          6. poll reply              |
|                                 |                      |                    |
|                       +---------v----------+  +--------+----------+         |
|                       |                    |  |                   |         |
|                       |   SNS Topic        |  |  SQS Reply Queue  |         |
|                       |   (events)         |  |  (replies)        |         |
|                       |                    |  |  5-min retention  |         |
|                       +--------+-----------+  +--------^----------+         |
|                                |                       |                    |
|                     2. SNS->SQS subscription     5. SendMessage             |
|                        (RawMessageDelivery=false)      |                    |
|                                |                       |                    |
|                       +--------v-----------+           |                    |
|                       |                    |           |                    |
|                       |   SQS Queue        |           |                    |
|                       |   (events)         |           |                    |
|                       |                    |           |                    |
|                       +--------+-----------+           |                    |
|                                |                       |                    |
|                         3. Lambda trigger              |                    |
|                                |                       |                    |
|                       +--------v-----------------------+-----------------+  |
|                       |  service-demo-sqs Lambda                        |  |
|                       |  main-sls-sqs.handler                           |  |
|                       |                                                 |  |
|                       |  +--------------------------------------------+ |  |
|                       |  | SqsServer.dispatchRecord()                 | |  |
|                       |  |                                            | |  |
|                       |  |  4a. Event (no correlationId):             | |  |
|                       |  |    eventName = body.Subject                | |  |
|                       |  |    -> @EventPattern("order.created")       | |  |
|                       |  |    -> fire and forget                      | |  |
|                       |  |                                            | |  |
|                       |  |  4b. Request (has correlationId):          | |  |
|                       |  |    pattern = body.Subject                  | |  |
|                       |  |    -> @MessagePattern({cmd:...})           | |  |
|                       |  |    -> capture return value                 | |  |
|                       |  |    -> sendReply(correlationId, result) ----+ |  |
|                       |  +--------------------------------------------+ |  |
|                       +-------------------------------------------------+  |
|                                                                             |
+-----------------------------------------------------------------------------+

  Request/Reply Flow (send):
  --------------------------
  1. HTTP Lambda publishes to SNS with correlationId + replyQueueUrl
  2. SNS delivers to SQS Queue (subscription)
  3. SQS triggers SQS Lambda
  4b. SQS Lambda processes, sends result to Reply Queue
  6. HTTP Lambda polls Reply Queue, matches correlationId, returns response

  Fire-and-Forget Flow (publish):
  --------------------------------
  1. HTTP Lambda publishes to SNS (no correlationId)
  2. SNS delivers to SQS Queue
  3. SQS triggers SQS Lambda
  4a. SQS Lambda processes, no reply sent
```

## Key Components

| Class | Role |
|---|---|
| `SnsServiceBusClient` | Publishes to SNS. Implements `publish()` (fire-and-forget) and `send()` (request/reply via correlation ID + reply queue polling) |
| `SqsServer` | NestJS `CustomTransportStrategy`. Receives from SQS, dispatches to `@EventPattern` / `@MessagePattern` handlers. Sends replies when `correlationId` is present. |
| `SnsServiceBusClientModule` | NestJS DynamicModule that registers `SnsServiceBusClient` as a provider |
| `SnsClientProxy` | NestJS `ClientProxy` implementation (alternative to `SnsServiceBusClient` for use with `ClientsModule`) |

## Message Routing

### publish() — fire-and-forget
```
SNS Publish:
  Subject  = eventName            (e.g. "order.created")
  Message  = JSON.stringify(payload)
```
The SQS consumer routes by `body.Subject` to `@EventPattern('order.created')` handlers.

### send() — request/reply
```
SNS Publish:
  Subject  = JSON.stringify(pattern)   (e.g. '{"cmd":"process-payment"}')
  Message  = JSON.stringify(payload)
  MessageAttributes:
    correlationId = <uuid>
    replyQueueUrl = <reply SQS queue URL>
```
The SQS consumer routes by `body.Subject` to `@MessagePattern({ cmd: 'process-payment' })` handlers, captures the return value, and sends it to `replyQueueUrl` with the same `correlationId`. The caller polls until it finds the matching reply.

## SNS MessageAttributes format

When `RawMessageDelivery: false` (the required setting), SNS wraps the message body. MessageAttributes are embedded in the body JSON using `{ Type, Value }` keys — **not** the SQS native `{ DataType, StringValue }` format:

```json
{
  "Type": "Notification",
  "Subject": "{\"cmd\":\"process-payment\"}",
  "Message": "{\"amount\":100}",
  "MessageAttributes": {
    "correlationId": { "Type": "String", "Value": "abc-123" },
    "replyQueueUrl": { "Type": "String", "Value": "https://sqs..." }
  }
}
```

## Configuration

### SnsServiceBusClient
```typescript
SnsServiceBusClientModule.register({
  region: 'us-east-1',
  topicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic',
  replyQueueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/my-replies',
  replyTimeoutMs: 10_000,   // default: 30_000
  endpoint: 'http://localhost:4566',  // optional, for LocalStack
})
```

### SqsServer
```typescript
new SqsServer({
  region: 'us-east-1',
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
  pollingIntervalMs: 1000,   // ignored in Lambda mode
  waitTimeSeconds: 20,
  maxMessages: 10,
  endpoint: 'http://localhost:4566',  // optional, for LocalStack
})
```

## Lambda vs polling mode

`SqsServer` works in two modes:

- **Polling mode** — calls `listen()`, polls the queue on a timer, deletes messages after successful dispatch. Used for local development / standalone NestJS microservices.
- **Lambda mode** — set `pollingIntervalMs: Number.MAX_SAFE_INTEGER` to disable polling. Call `dispatchRecord(sqsRecord)` directly from the Lambda handler. Lambda manages message deletion via batch-item failure responses.

## Cost structure

All costs are pay-per-use with no minimum. At typical demo/dev volumes these are effectively free, but worth understanding before scaling.

| Service | What triggers a charge | Price (us-east-1) |
|---|---|---|
| **SNS** | Per `publish()` or `send()` API call | $0.50 / 1M requests |
| **SQS** | Per message sent, received, or deleted | $0.40 / 1M requests |
| **Lambda (HTTP)** | Duration while polling the reply queue | $0.0000166667 / GB-second |
| **Lambda (SQS)** | Invocation + duration while processing | $0.20 / 1M invocations + duration |

### Requests per `publish()` call
- 1 SNS Publish
- 1 SQS receive (SNS → event queue, billed to SNS)

### Requests per `send()` call (request/reply)
- 1 SNS Publish
- 1 SQS receive (SNS → event queue)
- 1–N SQS ReceiveMessage polls on the reply queue (N depends on latency; typically 1–2)
- 1 SQS DeleteMessage on the reply queue
- 1 SQS SendMessage to the reply queue (from the SQS Lambda)

### Lambda cost note
The HTTP Lambda stays alive (and billing) while polling the reply queue waiting for a response. With `replyTimeoutMs: 10_000` and a typical round trip of 2–5 seconds, you pay for ~3–5 seconds of Lambda execution per `send()` call. Keep `replyTimeoutMs` as low as practical — a 30-second timeout on a failed call costs ~6x more than a 5-second one.

## Required AWS infrastructure

```yaml
Resources:
  MyTopic:       AWS::SNS::Topic
  MyQueue:       AWS::SQS::Queue        # subscribed to MyTopic (RawMessageDelivery: false)
  MyReplyQueue:  AWS::SQS::Queue        # for request/reply responses (no SNS subscription)
  SqsQueuePolicy: AWS::SQS::QueuePolicy # allows SNS to send to MyQueue

IAM permissions needed:
  Publisher Lambda:  sns:Publish on topic, sqs:ReceiveMessage + sqs:DeleteMessage on reply queue
  Consumer Lambda:   sqs:ReceiveMessage + sqs:DeleteMessage on event queue, sqs:SendMessage on reply queue
```
