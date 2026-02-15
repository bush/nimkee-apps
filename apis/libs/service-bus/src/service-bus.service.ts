import { Inject, Injectable } from '@nestjs/common';
import { ServiceBusClient } from './service-bus.interface';

@Injectable()
export class ServiceBusService {
  constructor(
    @Inject('SERVICE_BUS_CLIENTS')
    private readonly publishers: ServiceBusClient[],
  ) {}

  async publish(eventName: string, payload: unknown): Promise<void> {
    await Promise.all(
      this.publishers.map((p) => p.publish(eventName, payload)),
    );
  }

  async send(eventName: string, payload: unknown): Promise<any> {
    const results = await Promise.all(
      this.publishers.map((p) => p.send(eventName, payload)),
    );
    return results.find((r) => r != null);
  }
}
