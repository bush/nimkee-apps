import { Injectable } from '@nestjs/common';
import { TodosRepository } from './interfaces/todos-repository';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(
    private readonly todoRepository: TodosRepository
  ) {}

  create(createTodoDto: CreateTodoDto) {
    return this.todoRepository.create(createTodoDto);
  }

  findAll(next?: string, limit?: number) {
    return this.todoRepository.findAll(next, limit);
  }

  findOne(id: string) {
    return this.todoRepository.findOne(id);
  }

  update(id: string, updateTodoDto: UpdateTodoDto) {
    return this.todoRepository.update(id, updateTodoDto);
  }

  remove(id: string) {
    return this.todoRepository.remove(id);
  }
}