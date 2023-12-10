import { Test, TestingModule } from '@nestjs/testing';
import { StockPortfolioService } from './stock-portfolio.service';

describe('StockPortfolioService', () => {
  let service: StockPortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StockPortfolioService],
    }).compile();

    service = module.get<StockPortfolioService>(StockPortfolioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
