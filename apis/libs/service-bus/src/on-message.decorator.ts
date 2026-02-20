import { applyDecorators } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MessagePattern } from '@nestjs/microservices';

export function OnMessage(pattern: Record<string, any>): MethodDecorator {
  const eventKey = JSON.stringify(pattern);
  return applyDecorators(
    OnEvent(eventKey),
    //MessagePattern(pattern),
  );
}