import { CreateTodoDto } from '../dto/create-todo.dto';
import { UpdateTodoDto } from '../dto/update-todo.dto';
import { Todo, TodoID, Todos } from './todo';

export abstract class TodosRepository {
  abstract create(createTodoDto: CreateTodoDto): Promise<TodoID>;
  abstract findAll(next?: string, limit?: number): Promise<Todos>;
  abstract findOne(id: string): Promise<Todo>;
  abstract update(id: string, updateTodoDto: UpdateTodoDto): Promise<void>;
  abstract remove(id: string): Promise<void>;
}