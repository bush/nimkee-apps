import { Inject, Injectable } from '@nestjs/common';
import { ServiceBusClient, MessagePattern, ServiceBusTarget } from './service-bus.interface';

@Injectable()
export class ServiceBusService {
  constructor(
    @Inject('SERVICE_BUS_LOCAL_CLIENT')
    private readonly localPublisher: ServiceBusClient,
    @Inject('SERVICE_BUS_REMOTE_CLIENTS')
    private readonly remotePublishers: ServiceBusClient[],
  ) {}

  async publish(eventName: string, payload: unknown): Promise<void> {
    const all = [this.localPublisher, ...this.remotePublishers];
    await Promise.all(
      all.map((p) => p.publish(eventName, payload)),
    );
  }

  async send(pattern: MessagePattern, payload: unknown, target: ServiceBusTarget): Promise<any> {
    if (target === 'local') {
      return this.localPublisher.send(pattern, payload);
    }
    const results = await Promise.all(
      this.remotePublishers.map((p) => p.send(pattern, payload)),
    );
    return results.find((r) => r != null);
  }
}
