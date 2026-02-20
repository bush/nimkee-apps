import { Type } from '@nestjs/common';

export type MessagePattern = Record<string, any>;

export type ServiceBusTarget = 'local' | 'remote';

export interface ServiceBusOptions {
  imports?: any[];
  localPublisher: Type<ServiceBusClient>;
  remotePublishers?: Type<ServiceBusClient>[];
}

export interface ServiceBusClient {
  publish(eventName: string, payload: unknown): Promise<void>;
  send(pattern: MessagePattern, payload: unknown): Promise<any>;
}