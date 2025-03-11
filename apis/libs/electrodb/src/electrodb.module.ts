import { ConfigService } from '@nestjs/config';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';

@Module({})
export class ElectroDBRepoModule {
  static register(electrodbRepoProvider: Provider,
                  electrodbRepoConfigProvider: Provider,
                  dynamoDBDocumentProvier: Provider
  ): DynamicModule {
    return {
      module: ElectroDBRepoModule,
      providers: [
        electrodbRepoProvider,
        electrodbRepoConfigProvider,
        dynamoDBDocumentProvier,
      ],
      exports: [electrodbRepoProvider]
    }
  }
}
