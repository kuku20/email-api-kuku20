import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { StockPortfolioService } from './stock-portfolio.service';
import {
  InBuySellDto,
  InDepositWithDrawDto,
  CreateStockPortfolioDto,
} from './dto/index';
import { UserAuthGuard } from 'src/stock-user/guard';
import { JwtGuard } from 'src/auth/guard';
import { WalletTypeDto } from './dto/sourceValidate/wallet-type.dto';

@UseGuards(JwtGuard, UserAuthGuard)
@Controller('stock-portfolio')
export class StockPortfolioController {
  constructor(private readonly stockPortfolioService: StockPortfolioService) {}

  @Post('/wallet')
  createPortfolio(@Body() createStockUserDto: CreateStockPortfolioDto) {
    return this.stockPortfolioService.createPortfolio(createStockUserDto);
  }

  @Get('/wallet/:walletId') 
  getUserListById(@Param('walletId') walletId: string, @Query() querys: WalletTypeDto) {
    if(querys && querys.type){
      return this.stockPortfolioService.findAllTypeByUserId(walletId, querys.type);
    }
    return this.stockPortfolioService.findStockUserByUserId(walletId);
  }

  // @Get('/all')
  // findOne() {
  //   return this.stockPortfolioService.findAllPortfolios();
  // }

  @Post('/submit')
  submit(@Body() submit: InBuySellDto | InDepositWithDrawDto) {
    return this.stockPortfolioService.submit(submit);
  }
}
