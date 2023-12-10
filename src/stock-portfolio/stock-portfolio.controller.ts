import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StockPortfolioService } from './stock-portfolio.service';
import { CreateStockPortfolioDto } from './dto/create-stock-portfolio.dto';
import { UpdateStockPortfolioDto } from './dto/update-stock-portfolio.dto';

@Controller('stock-portfolio')
export class StockPortfolioController {
  constructor(private readonly stockPortfolioService: StockPortfolioService) {}

  @Post()
  create(@Body() createStockPortfolioDto: CreateStockPortfolioDto) {
    return this.stockPortfolioService.create(createStockPortfolioDto);
  }

  @Get()
  findAll() {
    return this.stockPortfolioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockPortfolioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStockPortfolioDto: UpdateStockPortfolioDto) {
    return this.stockPortfolioService.update(+id, updateStockPortfolioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockPortfolioService.remove(+id);
  }
}
