import { Logger } from '@nestjs/common'
import { ServiceDemoService } from './service-demo.service';
import { Controller, Get, Post, Body } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices'

@Controller()
export class ServiceDemoController {

  constructor(private readonly serviceDemoService: ServiceDemoService) { }

  @Post('send')
  sendMessage(@Body('data') data: any) {
    Logger.log('sending message to subscribers')
    return this.serviceDemoService.sendMessage(data);
  }

  @MessagePattern({ cmd: 'send_message' })
  async receiveMessage(data: { data: any }) {
    console.log('Received message:', data);
    return { status: 'ok' };
  }
}
