import { Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ServiceDemoService {
  constructor(@Inject('SERVICE_B') private readonly client: ClientProxy) {}

  sendMessage(data: any) {
    Logger.log('sending message')
    return this.client.send({ cmd: 'send_message' }, data);
  }
} 