import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';

import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { todosRepositoryModule } from '../module.config'

@Module({
  controllers: [TodosController],
  providers: [TodosService],
  imports: [todosRepositoryModule],
})
export class TodosModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('todos');
  }
}