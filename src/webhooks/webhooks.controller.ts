import { Controller, Post, Body, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtGuard } from 'src/auth/guard';
import { AdminUserAuthGuard } from 'src/stock-user/guard';
import { FileInterceptor } from '@nestjs/platform-express';

// @UseGuards(JwtGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

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

}
