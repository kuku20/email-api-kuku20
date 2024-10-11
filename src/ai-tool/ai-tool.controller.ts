import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiToolService } from './ai-tool.service';
import { JwtGuard } from 'src/auth/guard';
import { AdminUserAuthGuard } from 'src/stock-user/guard';

@UseGuards(JwtGuard)
@UseGuards(AdminUserAuthGuard)
@Controller('ai-tool')
export class AiToolController {
  constructor(private readonly aiToolService: AiToolService) {}

  @Post('gemini')
  create(@Body() createAiToolDto: any) {
    const { message, data } = createAiToolDto;
    // return message+JSON.stringify(data)
    return this.aiToolService.postGemini(message + JSON.stringify(data));
  }

  @Post('/get-advice')
  async getTickerFullChart_POLYGON(@Body() dataIn: any) {
    const { ticker, range, start, end, limit, message } = dataIn;
    try {
      const data = await this.aiToolService.getTickerFullChart_FMP(
        ticker,
        range,
        start,
        end,
        limit,
        message,
      );
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/fb/:id')
  getfb(@Param('id') id: string) {
    return this.aiToolService.getFromFB(id);
  }
}
