import { Logger } from '@nestjs/common'
import { ServiceDemoService } from './service-demo.service';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices'
import { OnMessage } from '@app/service-bus';

@Controller()
export class ServiceDemoController {

  constructor(private readonly serviceDemoService: ServiceDemoService) { }

  @Post('send')
  async sendMessage(@Body('data') data: any) {
    // We could just return the promise from sendMessage,
    // but this way we can log the response before returning it
    Logger.log('SERVICE-DEMO: sending message to subscribers')
    const response = await this.serviceDemoService.sendMessage(data);
    Logger.log(`SERVICE-DEMO: Received response: ${JSON.stringify(response)}`);
    return response;
  }

  // This would be called by another service sending a message
  // to this service
  @MessagePattern({ service: 'service-demo' })
  //@OnMessage({ service: 'service-demo' })
  async receiveMessage(data: { data: any }) {
    Logger.log(`SERVICE-DEMO: Received message: ${JSON.stringify(data)}`);
    return { status: 'ok from service-demo' };
  }

  @EventPattern('order.created')
    async handleOrderCreated(data: any) {
      console.log('SERVICE-B: Received order.created event:', data);
    }
}
