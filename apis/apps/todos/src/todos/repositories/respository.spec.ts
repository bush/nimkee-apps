import { Test, TestingModule } from "@nestjs/testing";
import { ConsoleLogger, Logger, LogLevel } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TodoPreview } from "../interfaces/todo";
import { TodosRepository } from "../interfaces/todos-repository";

import { ElectroDbTodoRepository } from './electrodb/todos-repository.service' 
import { TodosElectroDBRepoModule } from './electrodb/todos-repostitory.module';

import { localDocClientProvider, prodDocClientProvider } from '@app/electrodb'
import { join } from 'path'; 

// Logging on/off
const useLogger = false;
const levels: LogLevel[]  = ['log', 'error', 'warn'];
//const levels: LogLevel[]  = [];
const defaultTableName = 'TodosTable';

let repository: TodosRepository;


const electrodbTestModule = Test.createTestingModule({
  imports: [TodosElectroDBRepoModule.register(localDocClientProvider), ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [
      join('apps/todos/',
        `.env.${process.env.NODE_ENV}`),
      'apps/todos/.env.build.local'
    ]
  })]
}).setLogger(new ConsoleLogger('Repo Logger', { logLevels: levels }))
  .compile();

const fixtures = [
  {
    mapper: "electrodb",
    module: electrodbTestModule,

    all: (testModule: TestingModule) => {
      const config = testModule.get<ConfigService>(ConfigService);
      const todoRepo = testModule.get<ElectroDbTodoRepository>(TodosRepository);
      const tableName = config.get("TODO_TABLE_TABLENAME") || defaultTableName
      todoRepo.todos.setTableName(tableName);
    },

    each: (testModule: TestingModule) => {
      const config = testModule.get<ConfigService>(ConfigService);
      const todoRepo = testModule.get<ElectroDbTodoRepository>(TodosRepository);
      const tableName = config.get("TODO_TABLE_TABLENAME") || defaultTableName
      todoRepo.todos.setTableName(tableName);
    },

    ["should get all todos"]: (testModule: TestingModule) => {
      const todoRepo = testModule.get<ElectroDbTodoRepository>(TodosRepository);
      todoRepo.todos.setTableName("todo-table-empty-1");
    },
  },
];


let testName = '';
// Currently we only support electrodb for dynamodb but could support others in
// the future. The idea is to test to the repository interface.
describe.each(fixtures)("RepositoryService", (fixture) => {
  beforeAll(async () => {
    Logger.log(`NODE_ENV: ${process.env.NODE_ENV}`, "RepositoryService");
    const testModule = await fixture.module;
    fixture.all(testModule);
    repository = testModule.get<TodosRepository>(TodosRepository);
  });

  beforeEach(async () => {
    const testModule = await fixture.module;
    fixture.each?.(testModule);

    Logger.log(
      `NODE_ENV: ${process.env.NODE_ENV}, mapper: ${fixture.mapper}`,
      "RepositoryService"
    );
  });

  it("NOOP", async () => {
    Logger.log("NOOP");
  });

  it("should create a new todo", async () => {
    let todo = {
      title: "Test Todo",
      description: "Test Description",
      isCompleted: false,
    };
    const created = await repository.create(todo);
    const found = await repository.findOne(created.id);
    const createdTodo = { ...created, ...todo };
    expect(createdTodo).toEqual(found);
  });

  it("should update a todo", async () => {
    const todo = {
      title: "Update Test Todo",
      description: "Update Test Description",
      isCompleted: false,
    };
    const res = await repository.create(todo);
    const updatedTodo = { ...todo, isCompleted: true };
    await repository.update(res.id, updatedTodo);
    const { id, ...foundTodo } = await repository.findOne(res.id);
    expect(foundTodo).toEqual(updatedTodo);
  });


  testName = "should get all todos";
  it(testName, async () => {
    const testModule = await fixture.module;

    // Test specific setup
    fixture[testName]?.(testModule);

    // Create 20 test todos
    for (let index = 0; index < 20; index++) {
      await repository.create({
        title: `Test Todo ${index}`,
        isCompleted: false,
      });
    }

    let todos: TodoPreview[] = [];
    let next:string | undefined = undefined;
    let pages = 1;

    // Paginate through results
    // FIXME ... Change the behavior of next ... need to investigate!!!!
    do {
      const res = await repository.findAll(next);

      // Accumulate todos and move to the next page
      todos.push(...res.todos);

      Logger.log(`Page ${pages}: Fetched ${res.todos.length} todos`,
        "RepositoryService");
      pages++;
      next = res.next ? res.next : undefined;

    } while (next !== null);

    // Sort todos by the numerical value of the test number in the title
    todos.sort((a, b) => {
      const numA = parseInt(a.title.match(/\d+$/)?.[0] || "0", 10);
      const numB = parseInt(b.title.match(/\d+$/)?.[0] || "0", 10);
      return numA - numB;
    });

    // Final assertions
    Logger.log(`Total todos fetched: ${todos.length}`, "RepositoryService");
    expect(todos.length).toBe(20);

    // Validate overall correctness after sorting
    for (let i = 0; i < todos.length; i++) {
      expect(todos[i].title).toBe(`Test Todo ${i}`);
      expect(todos[i].isCompleted).toBe(false);
    }
  });

  it("should delete a todo", async () => {
    const todo = {
      title: "Delete Test Todo",
      description: "Delete Test Description",
      isCompleted: false,
    };
    const res = await repository.create(todo);
    await repository.remove(res.id);
    const foundTodo = await repository.findOne(res.id);
    expect(foundTodo).toBeNull();
  });
});
