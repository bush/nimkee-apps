import { Controller, Logger } from '@nestjs/common';
import { OnMessage } from '@app/service-bus';
import { Commands } from './commands';

@Controller()
export class OrdersController {
  @OnMessage({ cmd: Commands.CREATE_ORDER })
  async createOrder(payload: { itemId: string }) {
    Logger.log(`OrdersController.createOrder: ${JSON.stringify(payload)}`, 'Orders');
    return { status: 'created', order: { itemId: payload.itemId } };
  }

  @OnMessage({ cmd: Commands.GET_ORDER })
  async getOrder(payload: { id: string }) {
    Logger.log(`OrdersController.getOrder: ${JSON.stringify(payload)}`, 'Orders');
    return { status: 'ok', order: { id: payload.id } };
  }

  @OnMessage({ cmd: Commands.LIST_ORDERS })
  async listOrders(payload: any) {
    Logger.log(`OrdersController.listOrders: ${JSON.stringify(payload)}`, 'Orders');
    return { status: 'ok', orders: [] };
  }
}
