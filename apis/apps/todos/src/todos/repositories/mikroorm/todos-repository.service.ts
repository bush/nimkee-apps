import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

import { TodosRepository } from '../../interfaces/todos-repository';
import { CreateTodoDto } from '../../dto/create-todo.dto';
import { UpdateTodoDto } from '../../dto/update-todo.dto';
import { Todo, TodoID, Todos, TodoPreview } from '../../interfaces/todo';
import { TodoEntity } from './todo.entity';

@Injectable()
export class MikroORMTodosRepository implements TodosRepository {
  constructor(private readonly em: EntityManager) {}

  async create(createTodoDto: CreateTodoDto): Promise<TodoID> {
    const todo = this.em.create(TodoEntity, {
      id: uuidv4(),
      title: createTodoDto.title || 'untitled',
      description: createTodoDto.description || '',
      isCompleted: createTodoDto.isCompleted || false,
    });
    await this.em.persistAndFlush(todo);
    return { id: todo.id };
  }

  async findAll(next?: string, limit = 10): Promise<Todos> {
    const offset = next
      ? parseInt(Buffer.from(next, 'base64').toString(), 10)
      : 0;

    const [items, total] =  await this.em.findAndCount(
      TodoEntity,
      {},
      {
        fields: ['id', 'title', 'isCompleted'],
        limit,
        offset,
        orderBy: { id: 'ASC' },
      },
    );

    const result: Todos = { todos: items as TodoPreview[] };
    const nextOffset = offset + items.length;
    if (nextOffset < total) {
      result.next = Buffer.from(String(nextOffset)).toString('base64');
    }
    return result;
  }

  async findOne(id: string): Promise<Todo> {
    return this.em.findOne(TodoEntity, { id }) as Promise<Todo>;
  }

  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<void> {
    const todo = await this.em.findOneOrFail(TodoEntity, { id });
    this.em.assign(todo, updateTodoDto);
    await this.em.flush();
  }

  async remove(id: string): Promise<void> {
    const todo = await this.em.findOneOrFail(TodoEntity, { id });
    await this.em.removeAndFlush(todo);
  }
}
