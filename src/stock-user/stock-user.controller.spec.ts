import { Test, TestingModule } from '@nestjs/testing';
import { StockUserController } from './stock-user.controller';
import { StockUserService } from './stock-user.service';

describe('StockUserController', () => {
  let controller: StockUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockUserController],
      providers: [StockUserService],
    }).compile();

    controller = module.get<StockUserController>(StockUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
