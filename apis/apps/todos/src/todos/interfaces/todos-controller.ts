import { CreateTodoDto } from '../dto/create-todo.dto';
import { UpdateTodoDto } from '../dto/update-todo.dto';
import { QueryTodoDto } from '../dto/query-todo.dto';
import { Todo, TodoID, Todos } from './todo';

export interface ITodosController {
  create(createTodoDto: CreateTodoDto): Promise<TodoID>,
  findAll(query: QueryTodoDto): Promise<Todos>,
  findOne(id: string): Promise<Todo>,
  update(id: string, updateTodoDto: UpdateTodoDto): Promise<void>,
  remove(id: string): Promise<void>
}