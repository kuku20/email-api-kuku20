import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { JwtModule } from '@nestjs/jwt';
import { StockHelperService } from './stockHelper.service';

@Module({
  imports:[JwtModule.register({})],
  controllers: [StockController],
  providers: [StockService, StockHelperService]
})
export class StockModule {}
