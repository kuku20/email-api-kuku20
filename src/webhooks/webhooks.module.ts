import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { JwtModule } from '@nestjs/jwt';
import { StockService } from 'src/stock/stock.service';
import { StockHelperService } from 'src/stock/stockHelper.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, StockService,StockHelperService],
  imports:[JwtModule.register({})]
})
export class WebhooksModule {}
