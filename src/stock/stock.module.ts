import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { JwtModule } from '@nestjs/jwt';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { AlphavantageService } from 'src/alphavantage/alphavantage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataHistory1mo,DataHistory1d,DataHistory4h,DataHistory1h,DataHistory30m,DataHistory15m,DataHistory5m ,DataHistory1m } from './entities';

@Module({
  imports:[JwtModule.register({}),TypeOrmModule.forFeature([DataHistory1mo,DataHistory1d,DataHistory4h,DataHistory1h,DataHistory30m,DataHistory15m,DataHistory5m ,DataHistory1m])],
  controllers: [StockController],
  providers: [StockService, StockHelperService, LocalPLWR,AlphavantageService]
})
export class StockModule {}
