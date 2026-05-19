import { Injectable, Logger } from '@nestjs/common';
import { Commands } from './commands';

/**
 * Business logic for the direct Lambda invocation path.
 * Mirrors OrdersController but as a plain injectable service
 * so it can be called from a direct Lambda handler without HTTP or SQS.
 */
@Injectable()
export class OrdersDirectService {
  private readonly logger = new Logger(OrdersDirectService.name);

  async dispatch(cmd: string, payload: any): Promise<any> {
    this.logger.log(`Dispatching cmd=${cmd} payload=${JSON.stringify(payload)}`);
    switch (cmd) {
      case Commands.CREATE_ORDER:
        return { status: 'created', order: payload };
      case Commands.GET_ORDER:
        return { status: 'ok', order: { id: payload?.id } };
      case Commands.LIST_ORDERS:
        return { status: 'ok', orders: [] };
      default:
        throw new Error(`Unknown command: ${cmd}`);
    }
  }
}
