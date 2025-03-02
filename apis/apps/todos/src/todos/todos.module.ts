import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { TodosRepositoryElectorDBModule } from './repositories/electrodb/todos-repository.module';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  controllers: [TodosController],
  providers: [TodosService],
  imports: [TodosRepositoryElectorDBModule],
})
export class TodosModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('todos');
  }
}