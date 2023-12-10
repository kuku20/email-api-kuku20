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

  // @UseGuards(UserAuthGuard)
  @Get('/wallet/:walletId')
  getUserListById(@Param('walletId') walletId: string) {
    return this.stockPortfolioService.findStockUserByUserId(walletId);
  }

  @Get('/all')
  findOne() {
    return this.stockPortfolioService.findAllPortfolios();
  }

  @Post('/deposit')
  deposits(@Body() depositDto: DepositDto) {
    return this.stockPortfolioService.deposits(depositDto);
  }

  @Post('/withdraw')
  withdraws(@Body() withdrawDto: WithdrawDto) {
    return this.stockPortfolioService.withdraws(withdrawDto);
  }

  @Post('/buy')
  buys(@Body() buyDto: BuyDto) {
    return this.stockPortfolioService.buys(buyDto);
  }

  @Post('/sell')
  sells(@Body() sellDto: SellDto) {
    return this.stockPortfolioService.sells(sellDto);
  }

  @Post()
  create(@Body() createStockPortfolioDto: CreateStockPortfolioDto) {
    return this.stockPortfolioService.create(createStockPortfolioDto);
  }

  @Get()
  findAll() {
    return this.stockPortfolioService.findAll();
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
