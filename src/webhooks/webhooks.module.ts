import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { JwtModule } from '@nestjs/jwt';
import { StockService } from 'src/stock/stock.service';
import { StockHelperService } from 'src/stock/stockHelper.service';
import { AiToolService } from 'src/ai-tool/ai-tool.service';
import { SlackPbController } from './slacksPb.controller';

@Module({
  controllers: [WebhooksController,SlackPbController],
  providers: [WebhooksService, StockService,StockHelperService,AiToolService],
  imports:[JwtModule.register({})]
})
export class WebhooksModule {}
