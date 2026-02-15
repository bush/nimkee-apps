import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ServiceBusClient } from '../../interfaces/service-bus-client';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class P2pServiceBusClient implements ServiceBusClient {
  constructor(@Inject('P2P_SERVICE_BUS_CLIENT') private readonly client: ClientProxy) {}

  async publish(eventName: string, payload: unknown): Promise<void> {
    await lastValueFrom(this.client.emit(eventName, payload));
  }

  async send(eventName: string, payload: unknown): Promise<any> {
    return lastValueFrom(this.client.send({ cmd: eventName }, payload));
  }
}
