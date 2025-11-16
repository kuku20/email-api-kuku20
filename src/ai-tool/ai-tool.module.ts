import { Module } from '@nestjs/common';
import { AiToolService } from './ai-tool.service';
import { AiToolController } from './ai-tool.controller';
import { StockService } from 'src/stock/stock.service';
import { JwtModule } from '@nestjs/jwt';
import { StockHelperService } from 'src/stock/stockHelper.service';
@Module({
  controllers: [AiToolController],
  providers: [AiToolService,StockService, StockHelperService,],
  imports:[JwtModule.register({})]
})
export class AiToolModule {}
