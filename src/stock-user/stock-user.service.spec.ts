import { Test, TestingModule } from '@nestjs/testing';
import { StockUserService } from './stock-user.service';

describe('StockUserService', () => {
  let service: StockUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockUserService],
    }).compile();

    service = module.get<StockUserService>(StockUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
