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
    return this.aiToolService.postGemini(message, data);
  }
  


  @Post('/get-advice')
  async getTickerFullChart_POLYGON(@Body() dataIn: any) {
    const { ticker, selectedApi, start, end, message, type } = dataIn;
    try {
      const data = await this.aiToolService.getTickerFullChart_FMP(
        ticker,
        start,
        end,
        message,
        selectedApi,
        type
      );
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }


  @Post('/post-tofb')
  async postToFB(@Body() dataIn: any) {
    const { ticker, dataout, type } = dataIn;
    try {
      const datajson = JSON.parse(dataout)
      const data =  await this.aiToolService.postToFirebase(ticker, datajson, type)
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }
  @Get('/fb/:type/:id')
  getfb(@Param('id') id: string, @Param('type') type: string) {
    return this.aiToolService.getFromFB(id, type);
  }
}
