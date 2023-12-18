import { Test, TestingModule } from '@nestjs/testing';
import { StockPortfolioController } from './stock-portfolio.controller';
import { StockPortfolioService } from './stock-portfolio.service';

describe('StockPortfolioController', () => {
  let controller: StockPortfolioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockPortfolioController],
      providers: [StockPortfolioService],
    }).compile();

    controller = module.get<StockPortfolioController>(StockPortfolioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
