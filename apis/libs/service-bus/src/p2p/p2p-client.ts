import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ServiceBusClient, MessagePattern } from '../service-bus.interface';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class P2pServiceBusClient implements ServiceBusClient {
  constructor(@Inject('P2P_SERVICE_BUS_CLIENT') private readonly client: ClientProxy) {}

  async publish(eventName: string, payload: unknown): Promise<void> {
    await lastValueFrom(this.client.emit(eventName, payload));
  }

  async send(pattern: MessagePattern, payload: unknown): Promise<any> {
    return lastValueFrom(this.client.send(pattern, payload));
  }
}
