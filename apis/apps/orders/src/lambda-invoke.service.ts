import { Injectable, Logger } from '@nestjs/common';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

@Injectable()
export class LambdaInvokeService {
  private readonly logger = new Logger(LambdaInvokeService.name);
  private readonly client = new LambdaClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
  private readonly functionName = process.env.ORDERS_FUNCTION_NAME ?? '';

  async send(cmd: string, payload: unknown): Promise<any> {
    this.logger.log(`Invoking orders Lambda directly: cmd=${cmd}`);
    const response = await this.client.send(
      new InvokeCommand({
        FunctionName: this.functionName,
        Payload: JSON.stringify({ cmd, payload }),
      }),
    );
    return JSON.parse(Buffer.from(response.Payload!).toString());
  }
}
