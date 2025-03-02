import { Module } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TodoConfig } from './todos-config';
import { ElectroDbTodoRepository } from './todos-repository.service';
import { TodosRepository } from '../../interfaces/todos-repository';

const TodosRepositoryProvider = { provide: TodosRepository, useClass: ElectroDbTodoRepository };

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `config/dynamodb/.${process.env.NODE_ENV}.env`,
    }),
  ],
  providers: [
    TodosRepositoryProvider,
    TodoConfig,
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
  exports: [TodosRepositoryProvider],
})
export class TodosRepositoryElectorDBModule { }
