// Nestjs Imports
import { ConfigService } from '@nestjs/config';
import { DynamicModule, Module, Provider } from '@nestjs/common';

// External imports
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

// Local imports
import { TodosRepository } from '../../interfaces/todos-repository';
import { ElectroDbTodoRepository } from './todos-repository.service';

const TodosRepositoryProvider = {
  provide: TodosRepository,
  useClass: ElectroDbTodoRepository
};

// Thoughts: After re-reading the nestjs docs I second guessed having this as a module.
// But after more consideration this could be considered a feature module as it acts as
// a plugin to the todos module.
@Module({
  providers: [
    TodosRepositoryProvider, {
      provide: 'TABLE_CONFIG',
      useFactory: (config: ConfigService) => {
        return {
          tableName: config.get<string>('TODO_TABLE_TABLENAME'),
          pkName: config.get<string>('TODO_TABLE_PKNAME'),
          skName: config.get<string>('TODO_TABLE_SKNAME')
        }
      },
      inject: [ConfigService]
    }
  ],

  exports: [TodosRepositoryProvider]
})

export class TodosElectroDBRepoModule {
  static register(dynamoDBDocumentProvider: Provider<DynamoDBDocument>): DynamicModule {
    return {
      module: TodosElectroDBRepoModule,
      providers: [TodosRepositoryProvider, dynamoDBDocumentProvider],
      exports: [TodosRepositoryProvider]
    }
  }
}