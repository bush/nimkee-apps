import { join } from 'path';
import * as shell from 'shelljs'

import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { ConsoleLogger, Logger, LogLevel } from "@nestjs/common";
import { MikroORM } from "@mikro-orm/core";
import { BetterSqliteDriver } from "@mikro-orm/better-sqlite";

import { TodoPreview } from "../interfaces/todo";
import { TodosRepository } from "../interfaces/todos-repository";
import { TodosElectroDBRepoModule } from './electrodb/todos-repository.module';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ElectrodbService } from '@app/electrodb';
import { TodosMikroORMRepoModule } from './mikroorm/todos-repository.module';
import { ConfigService } from '@nestjs/config';

// SETTINGS
// Logging on/off
const levels: LogLevel[]  = ['log', 'error', 'warn'];
//const levels: LogLevel[] = [];

let repository: TodosRepository;

const electrodbFixture = {
  mapper: "electrodb",
  module: Test.createTestingModule({
    imports: [
      TodosElectroDBRepoModule.register({
          provide: DynamoDBDocument,
          useFactory: (config: ConfigService) => {
              const client = new DynamoDBClient({
                  endpoint: config.get<string>('ENDPOINT'),
                  region: config.get<string>('DEFAULT_REGION'),
                  credentials: {
                      accessKeyId: config.get<string>('ACCESS_KEY_ID') || '',
                      secretAccessKey: config.get<string>('SECRET_ACCESS_KEY') || ''
                  }
              });
              return DynamoDBDocument.from(client);
          }, inject: [ConfigService]
      }),
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [
          join('apps/todos/', `.env.${process.env.NODE_ENV}`),
          'apps/todos/.env.build.local'
        ]
      })
    ]
  }).setLogger(new ConsoleLogger('Repo Logger', { logLevels: levels })).compile(),
  setup: async (testModule: TestingModule) => {
    shell.exec('docker compose -f apps/todos/test/dynamodb/docker-compose.yml up -d',
      { fatal: true, silent: true });

    const config = testModule.get(ConfigService);
    const service = new ElectrodbService(testModule.get(DynamoDBDocument));
    await service.waitForTable(config.getOrThrow<string>('TODO_TABLE_TABLENAME'));
  },
  reset: async (testModule: TestingModule) => {
    shell.exec('docker compose -f apps/todos/test/dynamodb/docker-compose.yml restart',
      { fatal: true, silent: true });

    const config = testModule.get(ConfigService);
    const service = new ElectrodbService(testModule.get(DynamoDBDocument));
    await service.waitForTable(config.getOrThrow<string>('TODO_TABLE_TABLENAME'));
  },
  teardown: async (testModule: TestingModule) => {
    testModule.get(DynamoDBDocument).destroy();
  },
};

const mikroOrmSqliteFixture = {
  mapper: "mikroorm-sqlite",
  module: Test.createTestingModule({
    imports: [
      TodosMikroORMRepoModule.register({
        driver: BetterSqliteDriver,
        dbName: ':memory:',
        allowGlobalContext: true,
      }),
    ],
  }).setLogger(new ConsoleLogger('Repo Logger', { logLevels: levels })).compile(),
  setup: async (_testModule: TestingModule) => {},
  reset: async (testModule: TestingModule) => {
    const orm = testModule.get(MikroORM);
    await orm.schema.refreshDatabase();
  },
  teardown: async (_testModule: TestingModule) => {},
};

// Switch the fixture you want to test:
const fixture = mikroOrmSqliteFixture;
//const fixture = electrodbFixture;

describe(`RepositoryService (${fixture.mapper})`, () => {
  let testModule: TestingModule;

  beforeAll(async () => {
    Logger.log(`NODE_ENV: ${process.env.NODE_ENV}`, "RepositoryService");
    testModule = await fixture.module;
    repository = testModule.get<TodosRepository>(TodosRepository);
    await fixture.setup?.(testModule);
  }, 60000);

  afterAll(async () => {
    if (!testModule) return;
    await fixture.teardown?.(testModule);
    await testModule.close();
  });

  beforeEach(async () => {
    Logger.log(
      `NODE_ENV: ${process.env.NODE_ENV}, mapper: ${fixture.mapper}`,
      "RepositoryService"
    );
    await fixture.reset(testModule);
  }, 30000);

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
