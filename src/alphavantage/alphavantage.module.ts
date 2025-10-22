import { Module } from '@nestjs/common';
import { AlphavantageService } from './alphavantage.service';
import { AlphavantageController } from './alphavantage.controller';

@Module({
  controllers: [AlphavantageController],
  providers: [AlphavantageService]
})
export class AlphavantageModule {}
