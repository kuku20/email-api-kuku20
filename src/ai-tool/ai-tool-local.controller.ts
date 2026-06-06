import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiToolService } from './ai-tool.service';
import { JwtGuard } from 'src/auth/guard';
import { AdminUserAuthGuard } from 'src/stock-user/guard';

@Controller('ai-tool-local')
export class AiToolLocalController {
  constructor(private readonly aiToolService: AiToolService) {}

  @Post('gemini')
  create(@Body() createAiToolDto: any) {
    const { message, data } = createAiToolDto;
    // return message+JSON.stringify(data)
    return this.aiToolService.postGemini(message, data);
  }
}
