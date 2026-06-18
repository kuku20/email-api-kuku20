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
    const payload = JSON.parse(body.payload);

    const action = payload.actions[0];
    const ticker = action.value
    const timeframe_acID = action.action_id
    const orgMsgText = payload.message.text
    const orgThread_ts = payload.container.thread_ts
    const postToCSLRE = {channel:payload.channel.id,ts:payload.message.ts,ticker:ticker,timeframe:timeframe_acID}
    if(timeframe_acID==='more_options'){
      // update the orginial with more options bellow
      const orgThreadUpdate = this.webhooksService.getSlBlock(ticker,'delete_thop',orgMsgText)
      await this.webhooksService.Update_Slack(payload.channel.id,payload.message.ts,ticker+" Updated ✅ ")
      // update the btn and reply with more options 
      // 1 create blockoptions
      const blockre = this.webhooksService.getSlBlock(ticker,'full',orgMsgText)
      // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
      await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
    }else if(timeframe_acID==='getCurrentPrice'){
      // make api call pinhub
      const data = await this.stockService.realTimePrice_FINNHUB(ticker)
      const change = data.close - data.open;
      const changePct = (change / data.open) * 100;
      const trend = change >= 0 ? '📈' : '📉';
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${trend} Price Alert`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Date* \`${data.date}\``
            },
            {
              type: 'mrkdwn',
              text: `*Change*\`${change.toFixed(2)} (${changePct.toFixed(2)}%)\``
            },
            {
              type: 'mrkdwn',
              text: `*Open*$${data.open.toFixed(2)}`
            },
            {
              type: 'mrkdwn',
              text: `*High*$${data.high.toFixed(2)}`
            },
            {
              type: 'mrkdwn',
              text: `*Low*$${data.low.toFixed(2)}`
            },
            {
              type: 'mrkdwn',
              text: `*Close* \`$${data.close.toFixed(2)}\``
            }
          ]
        },
        {
          type: 'divider'
        }
      ];
      await this.webhooksService.reply_SLack(postToCSLRE.channel,orgThread_ts,'',blocks)
    }else if(timeframe_acID.includes('delete')){
      console.log('get ts in thread to delete')
      const valueDelete = timeframe_acID==='delete_replys'?2:0
      const tss = await this.webhooksService.getReplyTs(postToCSLRE.channel, orgThread_ts,valueDelete)
      await this.webhooksService.deleteMessage_SLack(postToCSLRE.channel,tss)
    } else if(timeframe_acID ==='1day'||timeframe_acID ==='4hour'){
        this.processApply(postToCSLRE)
    } else if(timeframe_acID ==='30min'){
      this.processApply(postToCSLRE)
      await this.webhooksService.Update_Slack(payload.channel.id,payload.message.ts,"Updated ✅"+ticker)
    }
    else{
      console.log('action')
      await this.webhooksService.reply_SLack(postToCSLRE.channel,payload.message.ts,'postnone')
    }
    // console.log(action)

    // if(){}
    // else if(timeframe_acID ==='1day'||timeframe_acID ==='4hour'){
    //   // console.log(postToCSLRE)
    //   this.processApply(postToCSLRE)
    // }else{
    //   this.processApply(postToCSLRE)
    //   const textCheck =timeframe_acID==='delete_replys'? ` <http://localhost:4200/price-log/${ticker}?daysRange=500|local> | <https://stockmarkets000.web.app/price-log/${ticker}?daysRange=500|production> | <https://www.tradingview.com/chart/mWoCISmu/?ticker=${ticker}|tradingview> |  <https://new-site-pwa.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day |OtherLink>`
    //                                         : ''
    //   await this.webhooksService.Update_Slack(payload.channel.id,payload.message.ts,"Updated ✅"+ticker+textCheck)
    // }
    return {
      text: '⏳ Processing application...',
      replace_original: false,
    };
  }

  async processApply(postToCSLRE: any) {
    console.log('run pross')
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
    console.log(body)
    await this.webhooksService.fePostToHold2(body.symbol,body.price,'more_options')
    return {
      text: '⏳ Processing application...',
      replace_original: false,
    };
  }
}
