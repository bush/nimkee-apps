import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ServiceBusClient, MessagePattern } from '../service-bus.interface';

@Injectable()
export class RedisServiceBusClient implements ServiceBusClient {
  constructor(@Inject('REDIS_SERVICE_BUS_CLIENT') private readonly client: ClientProxy) {}

  async publish(eventName: string, payload: unknown): Promise<void> {
    await lastValueFrom(this.client.emit(eventName, payload));
  }

  async send(pattern: MessagePattern, payload: unknown): Promise<any> {
    return lastValueFrom(this.client.send(pattern, payload ?? {}));
  }
}
