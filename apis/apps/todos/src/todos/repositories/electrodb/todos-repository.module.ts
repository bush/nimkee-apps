import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ElectroDbTodoRepository } from './todos-repository.service';
import { TodosRepository } from '../../interfaces/todos-repository';

const TodosRepositoryProvider = { provide: TodosRepository, useClass: ElectroDbTodoRepository };

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `config/dynamodb/.${process.env.NODE_ENV}.env`,
    }),
  ]
})
export class TodosRepositoryElectorDBModule {
  static register(electrodbRepoProvider: Provider): DynamicModule {
    return {
      module: TodosRepositoryElectorDBModule,
    
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
          provide: DynamoDBClient,
          useFactory: (config: ConfigService) => {
            console.log(`ACCESS_KEY: ${process.env.AWS_ACCESS_KEY_ID}`)

            return new DynamoDBClient({
              endpoint: config.get<string>('ENDPOINT'),
              region: config.get<string>('TODO_TABLE_REGION'),
            })
          },
          inject: [ConfigService],
        },
      ],
      exports: [TodosRepositoryProvider]
    }
  }
}
