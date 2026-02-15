import { Module } from '@nestjs/common';
import { LocalEventPublisher } from './local';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [LocalEventPublisher],
  exports: [LocalEventPublisher],
})
export class LocalEventModule {}
