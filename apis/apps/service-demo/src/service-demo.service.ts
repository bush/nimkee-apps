import { Logger, Injectable } from '@nestjs/common';
import { ServiceBusService } from './service-bus/service-bus.service';

@Injectable()
export class ServiceDemoService {
  constructor(private readonly serviceBus: ServiceBusService) {}

  async sendMessage(data: any) {
    Logger.log('sending message');
    return this.serviceBus.send('send_message', data);
  }
}