import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AiToolService } from './ai-tool.service';
import { CreateAiToolDto } from './dto/create-ai-tool.dto';
import { UpdateAiToolDto } from './dto/update-ai-tool.dto';

@Controller('ai-tool')
export class AiToolController {
  constructor(private readonly aiToolService: AiToolService) {}

  @Post('gemini')
  create(@Body() createAiToolDto: any) {
    const {message, data} = createAiToolDto
    // return message+JSON.stringify(data)
    return this.aiToolService.postGemini(message+JSON.stringify(data));
  }

}
