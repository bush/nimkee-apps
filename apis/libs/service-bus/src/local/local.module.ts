import { Module } from '@nestjs/common';
import { LocalServiceBusClient } from './local';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [LocalServiceBusClient],
  exports: [LocalServiceBusClient],
})
export class LocalEventModule {}
