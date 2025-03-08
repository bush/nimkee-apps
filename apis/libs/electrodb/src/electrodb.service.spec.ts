import { Test, TestingModule } from '@nestjs/testing';
import { ElectrodbService } from './electrodb.service';

describe('ElectrodbService', () => {
  let service: ElectrodbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElectrodbService],
    }).compile();

    service = module.get<ElectrodbService>(ElectrodbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
