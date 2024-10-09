import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AiToolService } from './ai-tool.service';
import { CreateAiToolDto } from './dto/create-ai-tool.dto';
import { UpdateAiToolDto } from './dto/update-ai-tool.dto';
import * as RequestDTO from '../stock/dto/sourceData';
@Controller('ai-tool')
export class AiToolController {
  constructor(private readonly aiToolService: AiToolService) {}

  @Post('gemini')
  create(@Body() createAiToolDto: any) {
    const {message, data} = createAiToolDto
    // return message+JSON.stringify(data)
    return this.aiToolService.postGemini(message+JSON.stringify(data));
  }

  @Post('/get-advice')
  async getTickerFullChart_POLYGON(
    @Body() dataIn:any
  ) {
    const {ticker, range, start, end, limit , message} = dataIn
    try {
      const data = this.aiToolService.getTickerFullChart_FMP(ticker, range, start, end, limit, message);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/fb/:id')
  getfb(@Param('id') id: string){
    return this.aiToolService.getFromFB(id)
  }
}
