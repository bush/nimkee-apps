import { Test, TestingModule } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TodosElectroDBRepoModule } from './repositories/electrodb/todos-repository.module';
import { AppModule } from '../app.module';
const impl = 'electrodb';

describe('TodosController', () => {
  let controller: TodosController;
  let service: TodosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    controller = module.get<TodosController>(TodosController);
    service = module.get<TodosService>(TodosService);

    
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a todo', async () => {
    const id = '1';
    const todoDto = { title: '', description: 'Test Description', isCompleted: false };
    const result = { id, ...todoDto };

    jest.spyOn(service, 'create').mockImplementation(async (todoDto) =>  (result));
    expect(await controller.create(todoDto)).toEqual({ id, ...todoDto });
  });
});
