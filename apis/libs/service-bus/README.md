# @app/service-bus

A transport-agnostic service bus for NestJS that abstracts messaging across local (EventEmitter2) and remote (TCP, Redis, etc.) transports behind a unified API.

## Design

The service bus separates **how** messages are delivered from **where** they are sent. Application code calls `send()` or `publish()` on `ServiceBusService` without knowing whether the handler is local or remote. Routing is driven by a **service map** — a simple configuration object that maps command names to typed transports.

### Key Concepts

- **`send(pattern, payload)`** — Point-to-point request/response. Routes to exactly one transport based on the service map. If the command is not in the map, it defaults to the local transport.
- **`publish(eventName, payload)`** — Fan-out fire-and-forget. Broadcasts to the local transport and all registered remote transports.
- **Service Map** — A `Record<string, TransportType>` that maps command names (from `pattern.cmd`) to transport types. This is where you control routing.
- **TransportType** — An enum (`P2P`, `REDIS`, `NATS`, `KAFKA`, `RABBITMQ`, `GRPC`) that identifies remote transports. Eliminates raw strings from config.
- **Transports** — `ServiceBusClient` implementations keyed by `TransportType` (e.g. `{ [TransportType.P2P]: P2pServiceBusClient }`). Each transport knows how to send/publish over its protocol.
- **Local** — The default transport, backed by `EventEmitter2`. Always present.

### Extracting Services from a Monolith

When a handler lives in the same process, `send()` routes locally by default. When you extract that handler into its own microservice, you add its command to the service map to route it to the appropriate remote transport. No changes to the calling code — just a config update.

## Usage

### 1. Define command constants

Create a `commands.ts` in your app to avoid raw strings:

```typescript
export const Commands = {
  PROCESS_PAYMENT: 'process-payment',
} as const;
```

### 2. Configure the module

Create a `module.config.ts` in your app:

```typescript
import { Transport } from '@nestjs/microservices';
import {
  ServiceBusModule, TransportType,
  LocalEventModule, LocalServiceBusClient,
  P2pServiceBusClient, P2pServiceBusClientModule,
} from '@app/service-bus';
import { Commands } from './commands';

// Maps command names to transport types.
// Commands not listed here default to local (EventEmitter2).
// When a service is extracted from the monolith, add its commands here
// to route them to the appropriate remote transport.
const serviceMap = {
  [Commands.PROCESS_PAYMENT]: TransportType.P2P,
};

export const serviceBusModule = ServiceBusModule.register({
  imports: [
    LocalEventModule,
    P2pServiceBusClientModule.register({
      name: 'P2P_SERVICE_BUS_CLIENT',
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: 3002 },
    }),
  ],
  local: LocalServiceBusClient,
  transports: { [TransportType.P2P]: P2pServiceBusClient },
  serviceMap,
});
```

Then import `serviceBusModule` in your app module:

```typescript
@Module({
  imports: [serviceBusModule],
})
export class AppModule {}
```

### 3. Send messages (request/response)

Inject `ServiceBusService` and call `send()` with a pattern object containing a `cmd` property:

```typescript
import { Commands } from './commands';

@Injectable()
export class PaymentService {
  constructor(private readonly serviceBus: ServiceBusService) {}

  async processPayment(data: any) {
    return this.serviceBus.send({ cmd: Commands.PROCESS_PAYMENT }, data);
  }
}
```

The service bus looks up `Commands.PROCESS_PAYMENT` in the service map. If it maps to a transport (e.g. `TransportType.P2P`), the message is sent over that transport. If not found, it goes to the local transport.

### 4. Publish events (fire-and-forget)

```typescript
await this.serviceBus.publish('order.created', { orderId: 123 });
```

This broadcasts to all transports (local + all remote).

### 5. Handle messages locally with `@OnMessage`

The `@OnMessage` decorator registers a handler for local `send()` calls. It uses `EventEmitter2` under the hood with the JSON-serialized pattern as the event key:

```typescript
import { Controller } from '@nestjs/common';
import { OnMessage } from '@app/service-bus';
import { Commands } from '../commands';

@Controller()
export class PaymentsListener {
  @OnMessage({ cmd: Commands.PROCESS_PAYMENT })
  async handlePayment(payload: any) {
    return { status: 'payment processed' };
  }
}
```

The class must be decorated with `@Controller()` and listed in the `controllers` array of your module.

### 6. Handle events locally with `@OnEvent`

For `publish()` events, use the standard NestJS `@OnEvent` decorator:

```typescript
@OnEvent('order.created')
async handleOrderCreated(payload: any) {
  // handle event
}
```

## ServiceBusModule.register() Options

| Option | Type | Description |
|---|---|---|
| `imports` | `any[]` | Modules that provide the transport clients (e.g. `LocalEventModule`, `P2pServiceBusClientModule`) |
| `local` | `Type<ServiceBusClient>` | The local transport class (typically `LocalServiceBusClient`) |
| `transports` | `Partial<Record<TransportType, Type<ServiceBusClient>>>` | Remote transports keyed by `TransportType` (e.g. `{ [TransportType.P2P]: P2pServiceBusClient }`) |
| `serviceMap` | `Record<string, TransportType>` | Maps command names to `TransportType` values. Commands not listed default to local. |

## TransportType Enum

```typescript
enum TransportType {
  P2P = 'p2p',
  REDIS = 'redis',
  NATS = 'nats',
  KAFKA = 'kafka',
  RABBITMQ = 'rabbitmq',
  GRPC = 'grpc',
}
```

## Implementing a Custom Transport

Create a class that implements `ServiceBusClient`:

```typescript
export interface ServiceBusClient {
  publish(eventName: string, payload: unknown): Promise<void>;
  send(pattern: MessagePattern, payload: unknown): Promise<any>;
}
```

Where `MessagePattern` is `Record<string, any> & { cmd: string }`.

Wrap it in a dynamic module that registers any underlying client (e.g. `ClientsModule`), then add it to `imports` and `transports` in the service bus config.

## Built-in Transports

### LocalServiceBusClient

Uses `EventEmitter2` for in-process messaging. `send()` serializes the pattern to JSON and uses `emitAsync` for request/response. `publish()` uses `emit` for fire-and-forget.

Provided by `LocalEventModule`.

### P2pServiceBusClient

Uses NestJS `ClientProxy` over TCP for point-to-point microservice communication.

Provided by `P2pServiceBusClientModule.register()`, which wraps `ClientsModule.register()`.
