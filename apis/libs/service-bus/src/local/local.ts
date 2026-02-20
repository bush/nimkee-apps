import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServiceBusClient, MessagePattern } from '../service-bus.interface';

@Injectable()
export class LocalServiceBusClient implements ServiceBusClient {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(eventName: string, payload: unknown): Promise<void> {
    this.eventEmitter.emit(eventName, payload);
  }

  async send(pattern: MessagePattern, payload: unknown): Promise<any> {
    const eventKey = JSON.stringify(pattern);
    const results = await this.eventEmitter.emitAsync(eventKey, payload);
    return results[0];
  }
}