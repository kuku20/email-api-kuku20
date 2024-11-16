import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtGuard } from 'src/auth/guard';
import { AdminUserAuthGuard } from 'src/stock-user/guard';


@UseGuards(JwtGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('discord')
  async sendDiscordNotification(@Body('message') message: string, @Body('botname') botname: string, @Body('lastdata') lastdata: string) {
    const result =  await this.webhooksService.sendDiscordNotification(message, botname, lastdata);
    return result;
  }

  @Post('slack')
  async sendSlackNotification(@Body('message') message: string) {
    const result = await this.webhooksService.sendSlackNotification(message);
    return result;
  }

  @UseGuards(AdminUserAuthGuard)
  @Post('delete-messages')
  async deleteMessagesByDay(
    @Body('date') date: string,
    @Body('ticker') ticker: string,
  ) {
    const result = await this.webhooksService.deleteMessages(ticker,date);
    return result;
  }
}
