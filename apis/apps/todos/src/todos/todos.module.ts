import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { TodosRepositoryElectorDBModule } from './repositories/electrodb/todos-repository.module';
import { ElectroDbTodoRepository } from './repositories/electrodb/todos-repository.service'
import { TodosRepository } from './interfaces/todos-repository'
import { LoggerMiddleware } from './middleware/logger.middleware';
import { ConfigModule } from '@nestjs/config';


@Module({
  controllers: [TodosController],
  providers: [TodosService],
  imports: [TodosRepositoryElectorDBModule.register({
    provide: TodosRepository,
    useClass: ElectroDbTodoRepository
  }),
  ConfigModule.forRoot({
    envFilePath: `config/dynamodb/.${process.env.NODE_ENV}.env`,
  })],
})
export class TodosModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('todos');
  }
}