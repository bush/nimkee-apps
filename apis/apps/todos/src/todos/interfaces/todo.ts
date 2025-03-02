export interface Todo {
  id: string;
  description: string;
  title: string;
  isCompleted: boolean;
}

export type TodoID = Pick<Todo, 'id'>;
export type TodoPreview = Pick<Todo, 'id' | 'title' | 'isCompleted'>;

export interface Todos {
  next: string,
  todos: TodoPreview[]
}