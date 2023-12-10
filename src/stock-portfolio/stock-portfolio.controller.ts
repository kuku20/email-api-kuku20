import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StockPortfolioService } from './stock-portfolio.service';
import {
  BuyDto,
  DepositDto,
  HoldingAmountsDto,
  SellDto,
  WithdrawDto,
  UserDto,
  CreateStockPortfolioDto,
  UpdateStockPortfolioDto,
} from './dto/index';

@Controller('stock-portfolio')
export class StockPortfolioController {
  constructor(private readonly stockPortfolioService: StockPortfolioService) {}

  // @UseGuards(UserAuthGuard)
  @Post('/wallet')
  createPortfolio(@Body() createStockUserDto: CreateStockPortfolioDto) {
    return this.stockPortfolioService.createPortfolio(createStockUserDto);
  }
  @Post()
  create(@Body() createStockPortfolioDto: CreateStockPortfolioDto) {
    return this.stockPortfolioService.create(createStockPortfolioDto);
  }

  @Get()
  findAll() {
    return this.stockPortfolioService.findAll();
  }

  @Get('/all')
  findOne() {
    return this.stockPortfolioService.findAllPortfolios();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStockPortfolioDto: UpdateStockPortfolioDto,
  ) {
    return this.stockPortfolioService.update(+id, updateStockPortfolioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockPortfolioService.remove(+id);
  }
}
