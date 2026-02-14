import { Type } from '@nestjs/common';


export interface ServiceBusOptions {
  imports?: any[];
  publishers: Type<ServiceBusClient>[];
}

export interface ServiceBusClient {
  publish(eventName: string, payload: unknown): Promise<void>;
  send(eventName: string, payload: unknown): Promise<any>;
}