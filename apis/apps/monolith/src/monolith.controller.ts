import { Body, Controller, Get, Post } from '@nestjs/common';
import { ServiceBusService } from '@app/service-bus';
import { MonolithService } from './monolith.service';
import { Commands } from './commands';

@Controller()
export class MonolithController {
  constructor(
    private readonly monolithService: MonolithService,
    private readonly serviceBus: ServiceBusService,
  ) {}

  @Get()
  getHello(): string {
    return this.monolithService.getHello();
  }

  @Post('orders')
  async createOrder(@Body() body: any) {
    return this.serviceBus.send({ cmd: Commands.CREATE_ORDER }, body);
  }
}
