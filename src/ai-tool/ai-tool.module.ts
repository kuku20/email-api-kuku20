import { Module } from '@nestjs/common';
import { AiToolService } from './ai-tool.service';
import { AiToolController } from './ai-tool.controller';
import { StockService } from 'src/stock/stock.service';
import { JwtModule } from '@nestjs/jwt';
@Module({
  controllers: [AiToolController],
  providers: [AiToolService,StockService],
  imports:[JwtModule.register({})]
})
export class AiToolModule {}
