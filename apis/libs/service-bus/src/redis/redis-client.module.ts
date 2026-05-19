import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RedisServiceBusClient } from './redis-client';

export interface RedisClientOptions {
  host?: string;
  port?: number;
}

@Module({})
export class RedisServiceBusClientModule {
  static register(options: RedisClientOptions = {}): DynamicModule {
    return {
      module: RedisServiceBusClientModule,
      imports: [
        ClientsModule.register([
          {
            name: 'REDIS_SERVICE_BUS_CLIENT',
            transport: Transport.REDIS,
            options: {
              host: options.host ?? 'localhost',
              port: options.port ?? 6379,
            },
          },
        ]),
      ],
      providers: [RedisServiceBusClient],
      exports: [RedisServiceBusClient],
    };
  }
}
