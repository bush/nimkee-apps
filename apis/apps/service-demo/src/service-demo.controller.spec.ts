import { Test, TestingModule } from '@nestjs/testing';
import { ServiceDemoController } from './service-demo.controller';
import { ServiceDemoService } from './service-demo.service';

describe('ServiceDemoController', () => {
  let serviceDemoController: ServiceDemoController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ServiceDemoController],
      providers: [ServiceDemoService],
    }).compile();

    serviceDemoController = app.get<ServiceDemoController>(ServiceDemoController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(serviceDemoController.getHello()).toBe('Hello World!');
    });
  });
});
