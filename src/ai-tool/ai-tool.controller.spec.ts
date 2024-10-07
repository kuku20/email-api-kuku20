import { Test, TestingModule } from '@nestjs/testing';
import { AiToolController } from './ai-tool.controller';
import { AiToolService } from './ai-tool.service';

describe('AiToolController', () => {
  let controller: AiToolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiToolController],
      providers: [AiToolService],
    }).compile();

    controller = module.get<AiToolController>(AiToolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
