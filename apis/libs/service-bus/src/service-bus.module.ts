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
          inject: [options.local],
        },
        {
          provide: 'SERVICE_BUS_TRANSPORTS',
          useFactory: (...clients: ServiceBusClient[]) => {
            const names = Object.keys(options.transports || {});
            const map: Record<string, ServiceBusClient> = {};
            names.forEach((name, i) => { map[name] = clients[i]; });
            return map;
          },
          inject: Object.values(options.transports || {}),
        },
        {
          provide: 'SERVICE_BUS_SERVICE_MAP',
          useValue: options.serviceMap || {},
        },
        ServiceBusService,
      ],
      exports: [ServiceBusService],
    };
  }
}