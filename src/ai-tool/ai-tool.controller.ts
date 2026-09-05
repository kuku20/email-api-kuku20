import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';

import { Response } from 'express';
import axios from 'axios';

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


  @Get('slack-image/:fileId')
  async getSlackImage(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    try {
      // 1. Get Slack file information
      const { data } = await axios.get(
        'https://slack.com/api/files.info',
        {
          params: {
            file: fileId,
          },
          headers: {
            Authorization: this.aiToolService.headers.Authorization,
          },
        },
      );
  
      if (!data.ok || !data.file) {
        return res.status(404).json({
          error: data.error || 'Slack file not found',
        });
      }
  
      const file = data.file;
  
      // 2. Download image from Slack
      const imageResponse = await axios.get(
        file.url_private_download || file.url_private,
        {
          headers: {
            Authorization: this.aiToolService.headers.Authorization,
          },
          responseType: 'stream',
        },
      );
  
      // 3. Return image directly to browser
      res.setHeader(
        'Content-Type',
        file.mimetype || 'image/png',
      );
  
      res.setHeader(
        'Content-Length',
        imageResponse.headers['content-length'] || file.size,
      );
  
      res.setHeader(
        'Cache-Control',
        'public, max-age=3600',
      );
  
      imageResponse.data.pipe(res);
  
    } catch (error: any) {
      console.error(
        'Slack image proxy error:',
        error?.response?.data || error,
      );
  
      if (!res.headersSent) {
        return res.status(500).json({
          error: 'Unable to load Slack image',
        });
      }
  
      res.end();
    }
  }
}
