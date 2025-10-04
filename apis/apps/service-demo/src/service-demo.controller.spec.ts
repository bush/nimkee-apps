import { Test, TestingModule } from '@nestjs/testing';

import { ServiceDemoService } from './service-demo.service';
import { ServiceDemoController } from './service-demo.controller';

describe('ServiceDemoController', () => {
  let serviceDemoController: ServiceDemoController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ServiceDemoController],
      providers: [ServiceDemoService],
    }).compile();

    serviceDemoController = app.get<ServiceDemoController>(ServiceDemoController);
  });
});
