import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { ServiceDemoService } from './service-demo.service';

@Controller()
export class ServiceDemoController {
  constructor(private readonly serviceDemoService: ServiceDemoService,
    @Inject('SERVICE_B') private client: ClientProxy) { }

  @Get()
  getHello(): string {
    return this.serviceDemoService.getHello();
  }

   @MessagePattern({ cmd: 'send_message' })
    async receiveMessage(data: { text: string }) {
      console.log('Received message:', data.text);
      return { status: 'ok' };
    }

  @Post('send')
  async sendMessage(@Body('text') text: string) {
    const response = await firstValueFrom(this.client.send({ cmd: 'send_message' }, { text }));
    //const response = 'fake respose'
    return { response };
  }
}
