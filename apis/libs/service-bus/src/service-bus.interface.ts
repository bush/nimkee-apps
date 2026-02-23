import { Type } from '@nestjs/common';

export enum TransportType {
  P2P = 'p2p',
  SNS_SQS = 'sns-sqs',
  REDIS = 'redis',
  NATS = 'nats',
  KAFKA = 'kafka',
  RABBITMQ = 'rabbitmq',
  GRPC = 'grpc',
}

export type MessagePattern = Record<string, any> & { cmd: string };

export interface ServiceBusOptions {
  imports?: any[];
  local: Type<ServiceBusClient>;
  transports?: Partial<Record<TransportType, Type<ServiceBusClient>>>;
  serviceMap?: Record<string, TransportType>;
}

export interface ServiceBusClient {
  publish(eventName: string, payload: unknown): Promise<void>;
  send(pattern: MessagePattern, payload: unknown): Promise<any>;
}