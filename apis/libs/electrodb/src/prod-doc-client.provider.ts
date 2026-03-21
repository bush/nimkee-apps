import { ConfigService } from '@nestjs/config';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Logger, Provider } from '@nestjs/common';

export const prodDocClientProvider: Provider<DynamoDBDocument> = {
    provide: DynamoDBDocument,
    useValue: DynamoDBDocument.from(new DynamoDBClient({}))
}