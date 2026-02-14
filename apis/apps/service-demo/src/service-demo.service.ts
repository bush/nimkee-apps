import { Logger, Injectable } from '@nestjs/common';
import { ServiceBusService } from './service-bus/service-bus';

@Injectable()
export class ServiceDemoService {
  constructor(private readonly events: ServiceBusService) {}

  async sendMessage(data: any) {
    Logger.log('sending message');
    //await this.events.publish('send_message', data);
  }
}