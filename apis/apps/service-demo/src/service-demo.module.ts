import { Module } from '@nestjs/common';
import { ClientProviderOptions, ClientsModule, Transport } from '@nestjs/microservices';

import { ServiceDemoService } from './service-demo.service';
import { ServiceDemoController } from './service-demo.controller';

const localServiceBOptions: ClientProviderOptions = {
  name: 'SERVICE_B',
  transport: Transport.TCP
}

const remoteServiceBOptions: ClientProviderOptions = {
  name: 'SERVICE_B',
  transport: Transport.TCP,
  options: {
    host: '127.0.0.1',
    port: 3001,
  },
}

@Module({
  imports: [ClientsModule.register([localServiceBOptions])],
  controllers: [ServiceDemoController],
  providers: [ServiceDemoService]
})
export class ServiceDemoModule { }
