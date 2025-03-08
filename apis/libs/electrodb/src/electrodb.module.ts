import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

@Module({})
export class ElectroDBModule {
  static register(electrodbRepoProvider: Provider): DynamicModule {
    return {
      module: ElectroDBModule,
      providers: [
        electrodbRepoProvider,
        {
          provide: 'TABLE_CONFIG',
          useFactory: (config: ConfigService) => {
            return {
              tableName: config.get<string>('TODO_TABLE_TABLENAME'),
              pkName: config.get<string>('TODO_TABLE_PKNAME'),
              skName: config.get<string>('TODO_TABLE_SKNAME')
            }
          },
          inject: [ConfigService]
        },
        {
          provide: DynamoDBDocument,
          useFactory: (config: ConfigService) => {
            const name = ElectroDBModule.name;
            Logger.log(`ACCESS_KEY: ${process.env.AWS_ACCESS_KEY_ID}`, name);
            Logger.log(`Dynamodb ENDPOINT: ${config.get<string>('ENDPOINT')}`, name);
            Logger.log(`Dynamodb TODO_TABLE_REGION: ${config.get<string>('TODO_TABLE_REGION')}`, name);

            const client = new DynamoDBClient({
              endpoint: config.get<string>('ENDPOINT'),
              region: config.get<string>('TODO_TABLE_REGION'),
            });

            return DynamoDBDocument.from(client);
          },
          inject: [ConfigService],
        },
      ],
      exports: [electrodbRepoProvider]
    }
  }
}
