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

  HoldingAmountsDto,
  InBuySellDto,
  InDepositWithDrawDto,
  UserDto,
  CreateStockPortfolioDto,
  UpdateStockPortfolioDto,
} from './dto/index';
import { UserAuthGuard } from 'src/stock-user/guard';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard)
@UseGuards(UserAuthGuard)
@Controller('stock-portfolio')
export class StockPortfolioController {
  constructor(private readonly stockPortfolioService: StockPortfolioService) {}

  @Post('/wallet')
  createPortfolio(@Body() createStockUserDto: CreateStockPortfolioDto) {
    return this.stockPortfolioService.createPortfolio(createStockUserDto);
  }

  @Get('/wallet/:walletId')
  getUserListById(@Param('walletId') walletId: string) {
    return this.stockPortfolioService.findStockUserByUserId(walletId);
  }

  // @Get('/all')
  // findOne() {
  //   return this.stockPortfolioService.findAllPortfolios();
  // }

  @Post('/submit')
  submit(@Body() submit: (InBuySellDto|InDepositWithDrawDto)) {
    return this.stockPortfolioService.submit(submit);
  }
}
