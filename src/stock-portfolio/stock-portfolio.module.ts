import { Module } from '@nestjs/common';
import { StockPortfolioService } from './stock-portfolio.service';
import { StockPortfolioController } from './stock-portfolio.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAuth } from 'src/auth/userAuth.entity';
import { StockPortfolio, Buy, Sell, Withdraw, Deposit, HoldingAmounts } from './entities';

@Module({
  controllers: [StockPortfolioController],
  providers: [StockPortfolioService],
  imports: [TypeOrmModule.forFeature([UserAuth,StockPortfolio,Buy, Sell, Withdraw, Deposit, HoldingAmounts])],
})
export class StockPortfolioModule {}
