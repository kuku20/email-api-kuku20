import { Module } from '@nestjs/common';
import { AiToolService } from './ai-tool.service';
import { AiToolController } from './ai-tool.controller';

@Module({
  controllers: [AiToolController],
  providers: [AiToolService]
})
export class AiToolModule {}
