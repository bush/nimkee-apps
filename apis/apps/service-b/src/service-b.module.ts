import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ServiceBService } from './service-b.service';
import { ServiceBController } from './service-b.controller';

@Module({
  imports: [ClientsModule.register([
        {
          name: 'SERVICE_DEMO',
          transport: Transport.TCP,
          options: {
            host: '127.0.0.1',
            port: 3002,
          },
        },
      ])],
  controllers: [ServiceBController],
  providers: [ServiceBService],
})
export class ServiceBModule {}
