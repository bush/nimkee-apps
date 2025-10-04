import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class ServiceBController {
  @MessagePattern({ cmd: 'send_message' })
  async receiveMessage(data: { text: string }) {
    console.log('Received message:', data);    
    return { status: 'ok' };
  }
}
