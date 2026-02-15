import { Test, TestingModule } from '@nestjs/testing';
import { LocalEventPublisher } from './local';

describe('LocalEventPublisher', () => {
  let provider: LocalEventPublisher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalEventPublisher],
    }).compile();

    provider = module.get<LocalEventPublisher>(LocalEventPublisher);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
