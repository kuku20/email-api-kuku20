import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { JwtModule } from '@nestjs/jwt';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { AlphavantageService } from 'src/alphavantage/alphavantage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataHistory } from './entities';

@Module({
  imports:[JwtModule.register({}),TypeOrmModule.forFeature([DataHistory])],
  controllers: [StockController],
  providers: [StockService, StockHelperService, LocalPLWR,AlphavantageService]
})
export class StockModule {}
