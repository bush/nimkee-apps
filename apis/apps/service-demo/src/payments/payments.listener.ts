import { Controller, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OnMessage } from '@app/service-bus';
import { PaymentsService } from './payments.service';
import * as util from 'util';

@Controller()
export class PaymentsListener {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Listen for order creation inside the same Nest app
   */
  @OnEvent('order.created')
  async handleOrderCreated(payload: any) {
    Logger.log(`payment system received order ${util.inspect(payload)}`, 'Payments')
  }

  /**
   * Listen for inventory failure to trigger refund
   */
  @OnEvent('inventory.reservation_failed')
  async handleInventoryFailure(payload: any) {
    console.log('Payment listener received inventory.reservation_failed event:', payload);
  }

  @OnMessage({ service: 'payments' })
  async handleSendMessage(payload: any) {
    Logger.log(`Payments received send_message: ${util.inspect(payload)}`, 'Payments');
    return { status: 'ok from payments' };
  }
}