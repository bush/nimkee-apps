import { DynamicModule, Module } from '@nestjs/common';
import { MikroOrmModule, MikroOrmModuleOptions } from '@mikro-orm/nestjs';

import { TodosRepository } from '../../interfaces/todos-repository';
import { MikroORMTodosRepository } from './todos-repository.service';
import { TodoEntity } from './todo.entity';

const TodosRepositoryProvider = {
  provide: TodosRepository,
  useClass: MikroORMTodosRepository,
};

@Module({})
export class TodosMikroORMRepoModule {
  static register(options: MikroOrmModuleOptions): DynamicModule {
    return {
      module: TodosMikroORMRepoModule,
      imports: [
        MikroOrmModule.forRoot({ ...options, entities: [TodoEntity] }),
        MikroOrmModule.forFeature([TodoEntity]),
      ],
      providers: [TodosRepositoryProvider],
      exports: [TodosRepositoryProvider],
    };
  }
}
