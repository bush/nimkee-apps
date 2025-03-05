import { v4 as uuidv4 } from "uuid";
import {
  BadRequestException,
  Inject,
  Injectable,
  Query,
  UseFilters,
} from "@nestjs/common";

import { Entity, Schema } from 'electrodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';


import { CreateTodoDto } from "../../dto/create-todo.dto";
import { UpdateTodoDto } from "../../dto/update-todo.dto";
import { Todo, Todos, TodoID, TodoPreview } from "../../interfaces/todo";
import { TodosRepository } from "../../interfaces/todos-repository";

import { InternalServerErrorException } from "@nestjs/common";

@Injectable()
export class ElectroDbTodoRepository implements TodosRepository {
  public todos: Entity<string, string, string, Schema<string, string, string>>;

  constructor(client: DynamoDBDocument,
    @Inject('TABLE_CONFIG') config: {
      tableName: string,
      pkName: string,
      skName: string
    }) {

      this.todos = new Entity<string, string, string, Schema<string, string, string>>({
      model: {
        entity: 'Todo',
        version: '1',
        service: 'TodoApp',
      },
      attributes: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        isCompleted: { type: 'boolean' },
      },
      indexes: {
        primary: {
          pk: { field: config.pkName, composite: [] },
          sk: { field: config.skName, composite: ['id'] },
        },
      },
    }, { table: config.tableName, client })
  }

  async create(createTodoDto: CreateTodoDto): Promise<TodoID> {
    const { title, description, isCompleted } = createTodoDto;
    const id = uuidv4();
    const complete = isCompleted || false;

    const result = await this.todos
      .put({
        id,
        title: title || "untitled",
        description: description || "",
        isCompleted: complete,
      })
      .go();

    return { id: result.data.id } as TodoID;
  }

  async findAll(next?: string, limit?: number): Promise<Todos> {
    try {
      
      const result = await this.todos.query.primary({}).go({
        cursor: next,
        attributes: ["id", "title", "isCompleted"],
        count: limit || 10,
      });

      const todos: Todos = { todos: result.data as TodoPreview[], next: null };
      todos.next = result.cursor;
      return todos;

    } catch (error) {

      if (error instanceof Error && 'code' in error && error.code === 4001) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }

  async findOne(id: string): Promise<Todo> {
    const result = await this.todos.get({ id }).go();
    if (!result.data) {
      return null;
    }

    if (!result.data) {
      return null;
    }
    return result.data as Todo;
  }

  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<void> {
    const { title, description, isCompleted } = updateTodoDto;
    const result = await this.todos
      .patch({ id })
      .set({ title, description, isCompleted })
      .go();
  }

  async remove(id: string): Promise<void> {
    await this.todos.delete({ id }).go();
  }
}
