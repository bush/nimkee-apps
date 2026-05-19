import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LambdaInvokeService } from './lambda-invoke.service';
import { Commands } from './commands';

@Controller('orders')
export class ProxyDirectController {
  constructor(private readonly lambdaInvoke: LambdaInvokeService) {}

  @Post()
  createOrder(@Body() body: any) {
    return this.lambdaInvoke.send(Commands.CREATE_ORDER, body);
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.lambdaInvoke.send(Commands.GET_ORDER, { id });
  }

  @Get()
  listOrders() {
    return this.lambdaInvoke.send(Commands.LIST_ORDERS, {});
  }
}
