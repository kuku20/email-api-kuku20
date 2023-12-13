import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
import { UserAuthGuard } from 'src/stock-user/guard';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard)
@Controller('stock-portfolio')
export class StockPortfolioController {
  constructor(private readonly stockPortfolioService: StockPortfolioService) {}

  @UseGuards(UserAuthGuard)
  @Post('/wallet')
  createPortfolio(@Body() createStockUserDto: CreateStockPortfolioDto) {
    return this.stockPortfolioService.createPortfolio(createStockUserDto);
  }

  @UseGuards(UserAuthGuard)
  @Get('/wallet/:walletId')
  getUserListById(@Param('walletId') walletId: string) {
    return this.stockPortfolioService.findStockUserByUserId(walletId);
  }

  // @Get('/all')
  // findOne() {
  //   return this.stockPortfolioService.findAllPortfolios();
  // }
  @UseGuards(UserAuthGuard)
  @Post('/deposit')
  deposits(@Body() depositDto: DepositDto) {
    return this.stockPortfolioService.deposits(depositDto);
  }
  @UseGuards(UserAuthGuard)
  @Post('/withdraw')
  withdraws(@Body() withdrawDto: WithdrawDto) {
    return this.stockPortfolioService.withdraws(withdrawDto);
  }

  @UseGuards(UserAuthGuard)
  @Post('/buy')
  buys(@Body() buyDto: BuyDto) {
    return this.stockPortfolioService.buys(buyDto);
  }

  @UseGuards(UserAuthGuard)
  @Post('/sell')
  sells(@Body() sellDto: SellDto) {
    return this.stockPortfolioService.sells(sellDto);
  }
}
