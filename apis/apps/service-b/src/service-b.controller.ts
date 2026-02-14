import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

@Controller()
export class ServiceBController {
  @MessagePattern({ cmd: 'send_message' })
  async receiveMessage(data: { text: string }) {
    console.log('SERVICE-B: Received message:', data);    
    return { status: 'ok from service-b' };
  }

  @EventPattern('order.created')
  async handleOrderCreated(data: any) {
    console.log('SERVICE-B: Received order.created event:', data);
  }
}
