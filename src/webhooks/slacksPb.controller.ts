import { Controller, Post, Body,Headers, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtGuard } from 'src/auth/guard';
import { AdminUserAuthGuard } from 'src/stock-user/guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { StockService } from 'src/stock/stock.service';

@Controller('slack')
export class SlackPbController {
  constructor(private readonly webhooksService: WebhooksService, private readonly stockService: StockService) {}

  @Post('interactions')
  // @UseInterceptors(FileInterceptor('file'))
  async  handleInteraction(
    @Headers() headers: any,
    @Body() body: any,
  ) {
    // console.log(headers);
    // console.log(body);
    const payload = JSON.parse(body.payload);

    // const action = payload.actions[0];
    await this.webhooksService.Update_Slack(payload.channel.id,payload.message.ts,)
    return { ok: true };
  }
}
