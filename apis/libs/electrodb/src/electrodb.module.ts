import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { fromIni } from '@aws-sdk/credential-providers';

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
            Logger.log(`📋 Dynamodb ENDPOINT: ${config.get<string>('ENDPOINT')}`, name);
            Logger.log(`📋 Dynamodb TODO_TABLE_REGION: ${config.get<string>('TODO_TABLE_REGION')}`, name);
           
            let client: DynamoDBClient;
            
            // Running a local instance in development mode
            if(config.get<string>('DB_LOCAL') === 'true') {
              Logger.log(`Using local dynamodb instance`)
              Logger.log(`ENDPOINT: ${config.get<string>('ENDPOINT')}`);
              Logger.log(`DEFAULT_REGION': ${config.get<string>('DEFAULT_REGION')}`);
              Logger.log(`ACCESS_KEY_ID': ${config.get<string>('ACCESS_KEY_ID')}`);
              Logger.log(`SECRET_ACCESS_KEY': ${config.get<string>('SECRET_ACCESS_KEY')}`);

              client = new DynamoDBClient({
                endpoint: config.get<string>('ENDPOINT'),
                region: config.get<string>('DEFAULT_REGION'),
                credentials :{
                  accessKeyId: config.get<string>('ACCESS_KEY_ID') || '',
                  secretAccessKey: config.get<string>('SECRET_ACCESS_KEY') || ''
                }
              });

            // Otherwise pick up the env
            } else {
              Logger.log(`Using aws dynamodb instance`)
              client = new DynamoDBClient({});
            }
            
            return DynamoDBDocument.from(client);
          },
          inject: [ConfigService],
        },
      ],
      exports: [electrodbRepoProvider]
    }
  }
}
