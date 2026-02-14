import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentsService } from './payments.service';
import { Logger } from '@nestjs/common'
import * as util from 'util';

@Injectable()
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
}