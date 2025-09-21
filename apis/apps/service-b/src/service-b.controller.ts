import { firstValueFrom } from 'rxjs';
import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';


@Controller()
export class ServiceBController {
  constructor( @Inject('SERVICE_DEMO') private client: ClientProxy) { }

  @MessagePattern({ cmd: 'send_message' })
  async receiveMessage(data: { text: string }) {
    console.log('Received message:', data.text);
    const response = await firstValueFrom(this.client.send({ cmd: 'send_message' }, { text: 'response' }));
    
    return { status: 'ok' };
  }
}
