import { Module } from '@nestjs/common';
import { AiToolService } from './ai-tool.service';
import { AiToolController } from './ai-tool.controller';
import { StockService } from 'src/stock/stock.service';

@Module({
  controllers: [AiToolController],
  providers: [AiToolService,StockService]
})
export class AiToolModule {}
