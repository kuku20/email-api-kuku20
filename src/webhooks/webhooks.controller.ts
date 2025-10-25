import { Controller, Post, Body, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtGuard } from 'src/auth/guard';
import { AdminUserAuthGuard } from 'src/stock-user/guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { StockService } from 'src/stock/stock.service';

// @UseGuards(JwtGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService, private readonly stockService: StockService) {}

  @UseGuards(JwtGuard)
  @Post('discord')
  @UseInterceptors(FileInterceptor('file'))
  async sendDiscordNotification(
    @UploadedFile() file: import('multer').File,
    @Body('message') message: string,
    @Body('botname') botname: string,
    @Body('lastdata') lastdata: string,
  ) {
    try {
      return await this.webhooksService.sendDiscordNotification(
        message,
        botname,
        lastdata,
        file,
      );
    } catch (err) {
      console.error('❌ Error in controller:', err);
      throw err;
    }
  }

  @UseGuards(JwtGuard)
  @Post('slack')
  async sendSlackNotification(@Body('message') message: string) {
    const result = await this.webhooksService.sendSlackNotification(message);
    return result;
  }


  @UseGuards(JwtGuard)
  @UseGuards(AdminUserAuthGuard)
  @Post('delete-messages')
  async deleteMessagesByDay(
    @Body('date') date: string,
    @Body('ticker') ticker: string,
  ) {
    const result = await this.webhooksService.deleteMessages(ticker, date);
    return result;
  }

  @Post('temporary')
  @UseInterceptors(FileInterceptor('file'))
  async temporary(
    @UploadedFile() file: import('multer').File,
    @Body('message') message: string,
    @Body('botname') botname: string,
    @Body('lastdata') lastdata: string,
  ) {
    try {
      if(!botname.includes('RSI')) return null
      const symbol = botname.split(' ')[1].toUpperCase();
      let extra
      if(symbol !== 'RSIENDBOT'){
        const metric = (await this.stockService.getMetric_FINHUB(symbol)).metric
        const metricStr = JSON.stringify(metric);
        if (lastdata === '{}') {// get current price form fm
          const type: any = 'multiple-company-prices';
          const dataArry = await this.stockService.fromFMP(type, symbol, null);
          lastdata = JSON.stringify(dataArry[0]) 
        }
        const currentQuoteStr = JSON.stringify(lastdata);
        const ask = `base on the latest data of ${symbol}: ${currentQuoteStr} and the metric ${metricStr}\n should buy/hold/sell, stop loss, and target levels`
        const datacode = encodeURIComponent(ask)
        extra = await this.webhooksService.shortenUrl(`https://chat.openai.com?q=${datacode}`);
      }
      return await this.webhooksService.sendDiscordNotification(
        message,
        botname,
        lastdata,
        file,
        extra
      );
    } catch (err) {
      console.error('❌ Error in controller:', err);
      throw err;
    }
  }



  @UseGuards(JwtGuard)
  @UseGuards(AdminUserAuthGuard)
  @Post('delete-messages-all')
  async bulkDelete(@Body('date') date: string,
  ) {
    const result = await this.webhooksService.bulkDelete();
    return result;
  }

  
}
