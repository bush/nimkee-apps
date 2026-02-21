import { Inject, Injectable } from '@nestjs/common';
import { ServiceBusClient, MessagePattern } from './service-bus.interface';

@Injectable()
export class ServiceBusService {
  constructor(
    @Inject('SERVICE_BUS_LOCAL_CLIENT')
    private readonly local: ServiceBusClient,
    @Inject('SERVICE_BUS_TRANSPORTS')
    private readonly transports: Record<string, ServiceBusClient>,
    @Inject('SERVICE_BUS_SERVICE_MAP')
    private readonly serviceMap: Record<string, string>,
  ) {}

  async publish(eventName: string, payload: unknown): Promise<void> {
    const all = [this.local, ...Object.values(this.transports)];
    await Promise.all(
      all.map((p) => p.publish(eventName, payload)),
    );
  }

  async send(pattern: MessagePattern, payload: unknown): Promise<any> {
    const transport = this.serviceMap[pattern.cmd];
    if (!transport) {
      return this.local.send(pattern, payload);
    }
    const publisher = this.transports[transport];
    if (!publisher) {
      throw new Error(`No publisher registered for transport "${transport}"`);
    }
    return publisher.send(pattern, payload);
  }
}
