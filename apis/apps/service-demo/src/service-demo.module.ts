import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ServiceDemoService } from './service-demo.service';
import { ServiceDemoController } from './service-demo.controller';

@Module({
  imports: [ClientsModule.register([
      {
        name: 'SERVICE_B',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3001,
        },
      },
    ])],
  controllers: [ServiceDemoController],
  providers: [ServiceDemoService],
})
export class ServiceDemoModule {}
