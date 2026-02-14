import { DynamicModule, Module } from '@nestjs/common';
import { ClientProviderOptions, ClientsModule } from '@nestjs/microservices';
import { P2pServiceBusClient } from './p2p-client';

@Module({})
export class P2pServiceBusClientModule {
  static register(options: ClientProviderOptions): DynamicModule {
    return {
      module: P2pServiceBusClientModule,
      imports: [ClientsModule.register([options])],
      providers: [P2pServiceBusClient],
      exports: [P2pServiceBusClient],
    };
  }
}
