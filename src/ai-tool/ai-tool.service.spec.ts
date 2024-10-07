import { Test, TestingModule } from '@nestjs/testing';
import { AiToolService } from './ai-tool.service';

describe('AiToolService', () => {
  let service: AiToolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiToolService],
    }).compile();

    service = module.get<AiToolService>(AiToolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
