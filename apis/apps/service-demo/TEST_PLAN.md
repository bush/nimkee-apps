# Test Plan: `service-demo` Lambda Deployment

## Scope

Tests covering the Lambda-specific additions described in `PLAN.md`:

1. `SqsServer.dispatchRecord()` — new public method on the shared lib
2. `main-sls.ts` — HTTP Lambda entrypoint (cold/warm start caching)
3. `main-sls-sqs.ts` — SQS Lambda entrypoint (record dispatching)
4. HTTP routes — functional smoke tests via `serverless-offline`
5. SQS dispatch — local invocation via `serverless invoke local`

---

## 1. Unit Tests — `SqsServer.dispatchRecord()`

**File:** `apis/libs/sns-sqs/src/server/sqs-server.spec.ts`
**Extend the existing** `describe('SqsServer')` block with a new nested suite:

```
describe('dispatchRecord()')
```

### Test cases

| # | Description | Input | Expected outcome |
|---|---|---|---|
| 1.1 | Routes SNS notification format by `Subject` | `body.Type === 'Notification'`, `body.Subject === 'order.created'`, `body.Message === '{"id":"1"}'` | Handler for `order.created` called with `{ id: '1' }` |
| 1.2 | Routes direct SQS message via `messageAttributes.eventName` | `attrs.eventName.stringValue === 'payment.processed'`, `body.payload === { amount: 100 }` | Handler for `payment.processed` called with `{ amount: 100 }` |
| 1.3 | Routes direct SQS message via `body.eventName` (fallback) | No `messageAttributes`, `body.eventName === 'inventory.updated'`, `body.payload === { sku: 'X' }` | Handler for `inventory.updated` called with `{ sku: 'X' }` |
| 1.4 | Falls back to whole body as payload when no `body.payload` key | `body.eventName === 'foo'`, body has no `payload` key | Handler called with full parsed body object |
| 1.5 | Logs warning and returns when no event name is resolvable | `body === {}`, no `messageAttributes` | No handler invoked; `logger.warn` called once |
| 1.6 | Logs warning and returns when no handler is registered | Valid `eventName` with no matching `addHandler` registration | `logger.warn` called with `No handler registered for event:` |
| 1.7 | Does NOT call `DeleteMessageCommand` | Any valid message | `sqsClient.send` is never called (deletion is AWS's responsibility in Lambda) |
| 1.8 | Handles malformed JSON body gracefully | `body = 'not-json'` | Throws or rejects (caller — the Lambda handler — catches and returns non-200 so AWS retries) |
| 1.9 | SNS `body.Message` that is not valid JSON is returned as raw string | `body.Message === 'plain string'` | Handler called with `'plain string'` (current `tryParseJson` behaviour) |

### Setup

```typescript
// No polling timer needed — construct with pollingIntervalMs: Number.MAX_SAFE_INTEGER
// and never call listen(). addHandler() can be called directly.
server = new SqsServer({
  region: 'us-east-1',
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/000000000000/test',
  pollingIntervalMs: Number.MAX_SAFE_INTEGER,
});
```

---

## 2. Unit Tests — `main-sls.ts` (HTTP Lambda)

**File:** `apis/apps/service-demo/src/main-sls.spec.ts` *(new file)*

Mock `nestInit` and `@codegenie/serverless-express`. Do not spin up a real NestJS app.

### Test cases

| # | Description | Expected outcome |
|---|---|---|
| 2.1 | First invocation calls `bootstrap()` and caches the server | `nestInit` called exactly once |
| 2.2 | Second invocation reuses the cached server (warm start) | `nestInit` still called only once after two `handler(...)` calls |
| 2.3 | `handler` delegates to the `serverlessExpress` adapter | The mock adapter function is called with the event, context, and callback |

---

## 3. Unit Tests — `main-sls-sqs.ts` (SQS Lambda)

**File:** `apis/apps/service-demo/src/main-sls-sqs.spec.ts` *(new file)*

Mock `NestFactory.createMicroservice` and `SqsServer.dispatchRecord`. Do not spin up a real NestJS app.

### Test cases

| # | Description | Input | Expected outcome |
|---|---|---|---|
| 3.1 | `bootstrap()` is called once on first invocation | First `handler()` call | `NestFactory.createMicroservice` called once |
| 3.2 | `sqsServer` is reused on subsequent invocations (warm start) | Two `handler()` calls | `NestFactory.createMicroservice` called only once |
| 3.3 | `dispatchRecord` called once per SQS record | `SQSEvent` with 3 records | `dispatchRecord` called 3 times |
| 3.4 | Each call passes correct `body` and `messageAttributes` | Record with known body and attributes | Args match per-record values |
| 3.5 | All records are dispatched concurrently (`Promise.all`) | 3 records, each takes 10ms | Total wall time ≈ 10ms, not 30ms |
| 3.6 | Handler resolves successfully for a valid event | Single record with known `eventName` | Promise resolves without throwing |

---

## 4. Integration — HTTP Routes via `serverless-offline`

**Prerequisite:** `npm run service-demo-sls:build` succeeds.

Start the offline server:
```bash
cd apis/serverless/service-demo
SNS_TOPIC_ARN='' SQS_QUEUE_URL='' SQS_QUEUE_ARN='' \
  serverless offline --stage dev --httpPort 3001
```

### Smoke tests (manual or scripted with `curl` / `httpie`)

| # | Request | Expected response |
|---|---|---|
| 4.1 | `GET /dev/` | 200 or 404 (app root) — confirms Lambda container boots without error |
| 4.2 | `GET /dev/api` | 200 — Swagger UI HTML confirms NestJS HTTP adapter is wired |
| 4.3 | `POST /dev/orders` with valid body | 201 Created — confirms `OrdersController` is reachable |
| 4.4 | `POST /dev/orders` with invalid body | 400 Bad Request — confirms `ValidationPipe` is active |
| 4.5 | `GET /dev/orders` | 200 — confirms read path works |
| 4.6 | Any route after first request | Response time significantly lower than first — confirms warm-start caching |

---

## 5. Integration — SQS Lambda via `serverless invoke local`

**Prerequisite:** `npm run service-demo-sls:build` succeeds.

### Test event files

**`test-events/sqs-direct.json`** — direct SQS format:
```json
{
  "Records": [{
    "body": "{\"eventName\":\"order.created\",\"payload\":{\"orderId\":\"test-123\"}}",
    "messageAttributes": {}
  }]
}
```

**`test-events/sqs-sns-wrapped.json`** — SNS-wrapped format:
```json
{
  "Records": [{
    "body": "{\"Type\":\"Notification\",\"Subject\":\"order.created\",\"Message\":\"{\\\"orderId\\\":\\\"test-456\\\"}\"}",
    "messageAttributes": {}
  }]
}
```

**`test-events/sqs-multi-record.json`** — batch of 3 records:
```json
{
  "Records": [
    { "body": "{\"eventName\":\"order.created\",\"payload\":{\"orderId\":\"a\"}}", "messageAttributes": {} },
    { "body": "{\"eventName\":\"inventory.reservation_failed\",\"payload\":{\"sku\":\"X\"}}", "messageAttributes": {} },
    { "body": "{\"Type\":\"Notification\",\"Subject\":\"order.created\",\"Message\":\"{\\\"orderId\\\":\\\"b\\\"}\"}", "messageAttributes": {} }
  ]
}
```

### Invocation commands

```bash
cd apis/serverless/service-demo

# Direct SQS format
serverless invoke local --function service-demo-sqs \
  --path test-events/sqs-direct.json --stage dev

# SNS-wrapped format
serverless invoke local --function service-demo-sqs \
  --path test-events/sqs-sns-wrapped.json --stage dev

# Batch
serverless invoke local --function service-demo-sqs \
  --path test-events/sqs-multi-record.json --stage dev
```

### Expected outcomes

| # | Event file | Expected log output |
|---|---|---|
| 5.1 | `sqs-direct.json` | `payment system received order` log line from `PaymentsListener` |
| 5.2 | `sqs-sns-wrapped.json` | Same — confirms SNS-wrapped routing via `Subject` |
| 5.3 | `sqs-multi-record.json` | Three handler log lines; handler invoked for all 3 records |
| 5.4 | Body with unknown `eventName` | `No handler registered for event:` warning; function exits 0 (AWS does not retry) |
| 5.5 | Malformed JSON body | Handler throws; function exits non-zero (AWS retries the batch) |

---

## 6. End-to-End — LocalStack (optional)

Requires LocalStack running locally with SQS and SNS services enabled.

```bash
# Create resources
aws --endpoint-url=http://localhost:4566 sns create-topic --name service-demo-events
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name service-demo-queue

# Subscribe queue to topic
TOPIC_ARN=$(aws --endpoint-url=http://localhost:4566 sns list-topics \
  --query 'Topics[0].TopicArn' --output text)
QUEUE_URL=http://localhost:4566/000000000000/service-demo-queue
QUEUE_ARN=arn:aws:sqs:us-east-1:000000000000:service-demo-queue

aws --endpoint-url=http://localhost:4566 sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol sqs \
  --notification-endpoint $QUEUE_ARN

# Deploy
AWS_ENDPOINT_URL=http://localhost:4566 SNS_TOPIC_ARN=$TOPIC_ARN \
  SQS_QUEUE_URL=$QUEUE_URL SQS_QUEUE_ARN=$QUEUE_ARN \
  serverless deploy --stage dev

# Trigger via HTTP → SNS publish → SQS → Lambda
curl -X POST http://localhost:4566/restapis/.../dev/orders \
  -H 'Content-Type: application/json' \
  -d '{"item":"widget","quantity":1}'

# Check SQS function logs in LocalStack
aws --endpoint-url=http://localhost:4566 logs tail /aws/lambda/service-demo-serverless-dev-service-demo-sqs
```

---

## Running the Unit Tests

```bash
# From apis/
npx jest --testPathPattern="sqs-server.spec|main-sls"
```

Or individually:

```bash
npx jest libs/sns-sqs/src/server/sqs-server.spec.ts
npx jest apps/service-demo/src/main-sls.spec.ts
npx jest apps/service-demo/src/main-sls-sqs.spec.ts
```

---

## Test Coverage Goals

| Area | Target |
|---|---|
| `SqsServer.dispatchRecord()` routing logic | 100% branch coverage |
| Lambda entrypoint cold/warm start caching | All paths covered |
| HTTP routes (smoke) | All defined endpoints return expected status codes |
| SQS record formats | Direct, SNS-wrapped, batch, unknown event, malformed JSON |
