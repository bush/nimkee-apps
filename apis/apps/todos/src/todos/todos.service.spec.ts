import { Test, TestingModule } from "@nestjs/testing";
import { TodosService } from "./todos.service";
import { TodosRepository } from "./interfaces/todos-repository";


describe("TodosService", () => {
  let service: TodosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: TodosRepository, useValue: {} },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
