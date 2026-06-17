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

    const action = payload.actions[0];
    const ticker = action.value
    const timeframe = action.action_id
    // console.log(action)
    const postToCSLRE = {channel:payload.channel.id,ts:payload.message.ts,ticker,timeframe}
    if(timeframe ==='1day'||timeframe ==='4hour'){
      // console.log(postToCSLRE)
      this.processApply(postToCSLRE)
    }else{
      this.processApply(postToCSLRE)
      const textCheck =timeframe==='remove'? `<http://localhost:4200/price-log/${ticker}?daysRange=500|local> | <https://stockmarkets000.web.app/price-log/${ticker}?daysRange=500|production> | <https://www.tradingview.com/chart/mWoCISmu/?ticker=${ticker}|tradingview> |  <https://new-site-pwa.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day |OtherLink>`
                                            : ''
      await this.webhooksService.Update_Slack(payload.channel.id,payload.message.ts,"Updated ✅"+ticker+textCheck)
    }
    // await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000));
    // let  fullData = await this.stockService.TwReveseNOAPI(ticker, timeframe);
    // await this.webhooksService.GeminiRecomendation(postToCSLRE, action.action_id, ticker, fullData);
    // await this.webhooksService.reply_SLack(payload.channel.id,payload.message.ts,"HOLA")
    // this.processApply(postToCSLRE)
    return {
      text: '⏳ Processing application...',
      replace_original: false,
    };
  }

  async processApply(postToCSLRE: any) {
    try {
      const isSupportedTimeframe = /(?:min|hour|day|week)$/.test(postToCSLRE.timeframe);
      if(isSupportedTimeframe){
        const  fullData = await this.stockService.TwReveseNOAPI(postToCSLRE.ticker, postToCSLRE.timeframe);
        const lastData = fullData[fullData.length - 1];
        const lastdataText = `${lastData.close} @ *${lastData.date }* On ${postToCSLRE.timeframe}`
        await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,lastdataText)
        await this.webhooksService.GeminiRecomendation(postToCSLRE, postToCSLRE.timeframe, [postToCSLRE.ticker], fullData);
      }else{
        return null
      }
    } catch (error) {
      await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,"TRY Again")
    }
  }


  @Post('add-holding-sl')
  async  addHoldingSl(
    @Body() body: any,
  ) {
    // console.log(body)
    await this.webhooksService.fePostToHold(body.symbol)
    return {
      text: '⏳ Processing application...',
      replace_original: false,
    };
  }
}
