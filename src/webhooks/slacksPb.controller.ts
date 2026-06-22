import { Controller, Post, Body,Headers} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { StockService } from 'src/stock/stock.service';
import { StockHelperService } from 'src/stock/stockHelper.service';

@Controller('slack')
export class SlackPbController {
  constructor(private readonly webhooksService: WebhooksService, private readonly stockService: StockService,private readonly stockHelperService: StockHelperService) {}

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
      await this.webhooksService.Update_Slack(payload.channel.id,payload.message.ts, `*${ticker}*  Check Me Out !!!!`)
      // update the btn and reply with more options 
      // 1 create blockoptions
      const fulloption = payload.channel.id ===this.stockHelperService.BTN_SL.HOLDING?'full_holding':'full_watchlist'
      const blockre = this.webhooksService.getSlBlock(ticker,fulloption,orgMsgText)
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
      // work on auto delete if in holding list
      if(timeframe_acID.includes('delete_fullc')){
        //get all msg
        const tss = await this.webhooksService.getAllMessages_SLack(postToCSLRE.channel)
        if(timeframe_acID==='delete_fullc_keep2'){
          await this.webhooksService.deleteMessage_SLack(postToCSLRE.channel,tss.slice(6,-1))
        }
        else{ 
          await this.webhooksService.deleteMessage_SLack(postToCSLRE.channel,tss.slice(0,-1))}
      }
    } else if(timeframe_acID ==='1day'||timeframe_acID ==='4hour'||timeframe_acID ==='30min'){
        this.processApply(postToCSLRE)
    // } else if(timeframe_acID ==='30min'){
    //   this.processApply(postToCSLRE)
    //   await this.webhooksService.Update_Slack(payload.channel.id,payload.message.ts,"Updated ✅"+ticker)
    } else if(timeframe_acID==='sell_or_keep'){
      // update meg to ask gimini
      // await new Promise((resolve) => setTimeout(resolve, 0.1 * 60 * 1000));
      console.log('sell_todod')
      const updateMe = await this.webhooksService.reply_SLack(postToCSLRE.channel,payload.message.ts,'...running')
      this.keepOradd(postToCSLRE,updateMe)
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

        const aiMesAsk = await this.webhooksService.autoRunReQS(postToCSLRE.ticker,fullData,postToCSLRE.timeframe)
        const resAI = await this.webhooksService.getMsgSendFromLLm(aiMesAsk)
        await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,resAI)
        // await this.webhooksService.GeminiRecomendation(postToCSLRE, postToCSLRE.timeframe, [postToCSLRE.ticker], fullData);
      }else{
        return null
      }
    } catch (error) {
      await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,"TRY Again")
    }
  }

  async keepOradd(postToCSLRE: any, updateMe) {
    console.log('run pross')
    try {
      const  fullData = await this.stockService.TwReveseNOAPI(postToCSLRE.ticker, '1day');
      const aiMesAsk = await this.webhooksService.askTokeepIncread(postToCSLRE.ticker,fullData)
      const resAI = await this.webhooksService.getMsgSendFromLLm(aiMesAsk)
      await this.webhooksService.Update_Slack(postToCSLRE.channel,updateMe.ts,resAI)
      return resAI
    } catch (error) {
      await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'error')
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
