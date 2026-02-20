import { DynamicModule, Module } from '@nestjs/common';

import { ServiceBusService } from './service-bus.service';
import { ServiceBusClient, ServiceBusOptions } from './service-bus.interface';

@Module({})
export class ServiceBusModule {
  static register(options: ServiceBusOptions): DynamicModule {
    return {
      module: ServiceBusModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'SERVICE_BUS_LOCAL_CLIENT',
          useFactory: (client: ServiceBusClient) => client,
          inject: [options.localPublisher],
        },
        {
          provide: 'SERVICE_BUS_REMOTE_CLIENTS',
          useFactory: (...clients: ServiceBusClient[]) => clients,
          inject: options.remotePublishers || [],
        },
        ServiceBusService,
      ],
      exports: [ServiceBusService],
    };
  }
}