import { Test, TestingModule } from '@nestjs/testing';
import { QuickeatController } from './quickeat.controller';
import { QuickeatService } from './quickeat.service';

describe('QuickeatController', () => {
  let quickeatController: QuickeatController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [QuickeatController],
      providers: [QuickeatService],
    }).compile();

    quickeatController = app.get<QuickeatController>(QuickeatController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(quickeatController.getHello()).toBe('Hello World!');
    });
  });
});
