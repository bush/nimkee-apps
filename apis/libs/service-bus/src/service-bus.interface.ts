import { Type } from '@nestjs/common';

export type MessagePattern = Record<string, any> & { cmd: string };

export interface ServiceBusOptions {
  imports?: any[];
  local: Type<ServiceBusClient>;
  transports?: Record<string, Type<ServiceBusClient>>;
  serviceMap?: Record<string, string>;
}

export interface ServiceBusClient {
  publish(eventName: string, payload: unknown): Promise<void>;
  send(pattern: MessagePattern, payload: unknown): Promise<any>;
}