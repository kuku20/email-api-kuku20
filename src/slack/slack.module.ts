import { Module } from '@nestjs/common';
import { SlackService } from './slack.service';
import { StockHelperService } from 'src/stock/stockHelper.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  providers: [StockHelperService,MessagesService ],
  controllers: [ MessagesController ],
})
export class SlackModule {}
