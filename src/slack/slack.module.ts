import { Module } from '@nestjs/common';
import { SlackService } from './slack.service';
import { StockHelperService } from 'src/stock/stockHelper.service';

@Module({
  providers: [SlackService ,StockHelperService,]
})
export class SlackModule {}
