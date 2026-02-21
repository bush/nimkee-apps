import { Logger, Injectable } from '@nestjs/common';
import { ServiceBusService } from '@app/service-bus';

@Injectable()
export class ServiceDemoService {
  constructor(private readonly serviceBus: ServiceBusService) {}

  async sendMessage(data: any) {
    Logger.log('sending message');
    return this.serviceBus.send({ cmd: 'process-payment' }, data);
  }
}