import { Injectable } from '@nestjs/common';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';

@Injectable()
export class ElectrodbService {
  constructor(private readonly client: DynamoDBDocument) {}

  async waitForTable(
    tableName: string,
    maxRetries = 40,
    delayMs = 300,
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await this.client.send(new DescribeTableCommand({ TableName: tableName }));
        if (res.Table?.TableStatus === 'ACTIVE') return;
      } catch { /* table not ready yet */ }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    throw new Error(`Table "${tableName}" not active after ${maxRetries} retries`);
  }
}
