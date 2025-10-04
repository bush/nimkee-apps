import { join } from 'path';
import * as shell from 'shelljs'

import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { ConsoleLogger, Logger, LogLevel } from "@nestjs/common";

import { TodoPreview } from "../interfaces/todo";
import { TodosRepository } from "../interfaces/todos-repository";
import { TodosElectroDBRepoModule } from './electrodb/todos-repository.module';
import { localDocClientProvider, prodDocClientProvider } from '@app/electrodb'

// SETTINGS
// Logging on/off
const levels: LogLevel[]  = ['log', 'error', 'warn'];
//const levels: LogLevel[] = [];

let repository: TodosRepository;

function restartComposeStack(composeFile: string) {
  return shell.exec(`docker compose -f ${composeFile} restart`,
    { fatal: true, silent: true }).stdout;
};

const electrodbTestModule = Test.createTestingModule({
  imports: [TodosElectroDBRepoModule.register(localDocClientProvider),
  ConfigModule.forRoot({
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
    compose: 'apps/todos/test/dynamodb/docker-compose.yml'
  }
];


// Currently we only support electrodb for dynamodb but could support others in
// the future. The idea is to test to the repository interface.
describe.each(fixtures)("RepositoryService", (fixture) => {
  beforeAll(async () => {
    Logger.log(`NODE_ENV: ${process.env.NODE_ENV}`, "RepositoryService");
    const testModule = await fixture.module;
    repository = testModule.get<TodosRepository>(TodosRepository);
  });

  beforeEach(async () => {
    const testModule = await fixture.module;

    Logger.log(
      `NODE_ENV: ${process.env.NODE_ENV}, mapper: ${fixture.mapper}`,
      "RepositoryService"
    );
    restartComposeStack(fixture.compose);
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

  it("should get all todos", async () => {
    const testModule = await fixture.module;

    // Create 20 test todos
    for (let index = 0; index < 20; index++) {
      await repository.create({
        title: `Test Todo ${index}`,
        isCompleted: false,
      });
    }

    let todos: TodoPreview[] = [];
    let next: string | undefined = undefined;
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
      next = 'next' in res ? res.next : undefined;

    } while (next !== undefined);

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
