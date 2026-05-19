import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ServiceBusService } from '@app/service-bus';
import { Commands } from './commands';

@Controller('orders')
export class ProxyController {
  constructor(private readonly serviceBus: ServiceBusService) {}

  @Post()
  createOrder(@Body() body: any) {
    return this.serviceBus.send({ cmd: Commands.CREATE_ORDER }, body);
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.serviceBus.send({ cmd: Commands.GET_ORDER }, { id });
  }

  @Get()
  listOrders() {
    return this.serviceBus.send({ cmd: Commands.LIST_ORDERS }, {});
  }
}
