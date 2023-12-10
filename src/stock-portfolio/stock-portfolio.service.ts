import { Injectable } from '@nestjs/common';
import { CreateStockPortfolioDto } from './dto/create-stock-portfolio.dto';
import { UpdateStockPortfolioDto } from './dto/update-stock-portfolio.dto';

@Injectable()
export class StockPortfolioService {
  create(createStockPortfolioDto: CreateStockPortfolioDto) {
    return 'This action adds a new stockPortfolio';
  }

  findAll() {
    return `This action returns all stockPortfolio`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stockPortfolio`;
  }

  update(id: number, updateStockPortfolioDto: UpdateStockPortfolioDto) {
    return `This action updates a #${id} stockPortfolio`;
  }

  remove(id: number) {
    return `This action removes a #${id} stockPortfolio`;
  }
}
