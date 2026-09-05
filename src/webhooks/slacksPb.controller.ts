import { Controller, Post, Body,Headers} from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';
import { StockService } from 'src/stock/stock.service';
import { StockHelperService } from 'src/stock/stockHelper.service';
import { SirvService } from './sirv.service';

@Controller('slack')
export class SlackPbController {
  constructor(
    private readonly webhooksService: WebhooksService, 
    private readonly stockService: StockService,
    private readonly sH_Service: StockHelperService,
    private readonly sirvService: SirvService,
  ) {}

  @Post('interactions')
  // @UseInterceptors(FileInterceptor('file'))
  async  handleInteraction(
    @Headers() headers: any,
    @Body() body: any,
  ) {
    const payload = JSON.parse(body.payload);
    const action = payload.actions[0];
    const ticker = action.value
    const timeframe_acID = action.action_id
    const channel = payload.channel.id
    const orgMsgText = payload.message.text
    const orgThread_ts = payload.container.thread_ts
    const postToCSLRE = {channel:channel,ts:payload.message.ts,ticker:ticker,timeframe:timeframe_acID}
    console.log('timeframe_acID',timeframe_acID)
    if(timeframe_acID==='more_options'){
      // update the orginial with more options bellow
      const orgThreadUpdate = this.webhooksService.getSlBlock(ticker,'delete_thop',orgMsgText)
      await this.webhooksService.Update_Slack(payload.channel.id,payload.message.ts, `*${ticker}*  Check Me Out !!!!`)
      // update the btn and reply with more options 
      // 1 create blockoptions
      const fulloption = payload.channel.id ===this.sH_Service.BTN_SL.HOLDING?'full_holding':'accessory_full_watchlist'
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
    } else if(timeframe_acID.includes('timeframe_interval')){
      const timeframe = action.selected_option.value
      const symbol =
        payload.message.blocks[1].type === 'actions'
          ? payload.message.blocks[1].elements[0].value
          : action?.block_id
          ? action?.block_id
          : 'QQQ';
      const isSupportedTimeframe = /(?:min|hour|day|week)$/.test(timeframe);
      if(isSupportedTimeframe){
        await this.CHECKBULL_BEAR_processTickers(symbol,timeframe,postToCSLRE)
      }else {
        console.error(`No timeframe specified for ${symbol}. Checking all timeframes...`);
      
        const timeframes = [
          '15min',
          '30min',
          '1hour',
          '4hour',
          '1day'
        ];
      
        for (const timeframe of timeframes) {
          await this.CHECKBULL_BEAR_processTickers(
            symbol,
            timeframe,
            postToCSLRE
          );
        }
      }
    } else if(timeframe_acID ==='clear_itself'){
      const filename = action.value
      const x = await this.sirvService.deleteImage(filename)
      const y = await this.webhooksService.deleteMessage_SLack(postToCSLRE.channel,[payload.message.ts])
      // console.log('clear_itself',x,y)
    } else if(timeframe_acID ==='turn_On_Off') {
      const filename = action.value
      let setValue
      let blockre 
      if(filename === 'turnOn') {
        setValue = true
        blockre = this.webhooksService.slElementOptions('turnOff','turn_On_Off')
      } else {
        setValue = false
        blockre = this.webhooksService.slElementOptions('turnOn','turn_On_Off')
      }
      await this.webhooksService.Update_Slack(payload.channel.id,payload.message.ts, `*${ticker}*  Check Me Out !!!!`,blockre)
      await this.stockService.FireBaseApi(
        'put',
        `stock-related/turnOffNow.json`,
        { data: setValue },
      );
    } else{
      console.log('action',timeframe_acID, ticker)
      await this.webhooksService.reply_SLack(postToCSLRE.channel,payload.message.ts,'postnone')
    }
    // console.log(action)

    // if(){}
    // else if(timeframe_acID ==='1day'||timeframe_acID ==='4hour'){
    //   // console.log(postToCSLRE)
    //   this.processApply(postToCSLRE)
    // }else{
    //   this.processApply(postToCSLRE)
    //   const textCheck =timeframe_acID==='delete_replys'? ` <${this.sH_Service.local4200}/price-log/${ticker}?daysRange=500|local> | <${this.sH_Service.stockMk000}/price-log/${ticker}?daysRange=500|production> | <https://www.tradingview.com/chart/mWoCISmu/?ticker=${ticker}|tradingview> |  <https://new-site-pwa.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day |OtherLink>`
    //                                         : ''
    //   await this.webhooksService.Update_Slack(payload.channel.id,payload.message.ts,"Updated ✅"+ticker+textCheck)
    // }
    return {
      text: '⏳ Processing application...',
      replace_original: false,
    };
  }


  @Post('suggestion')
  async  handleBlockSugg(
    @Body() body: any,
  ) {
    const payload = JSON.parse(body.payload);
  
    if (payload.type === 'block_suggestion') {
      const stocks = ['5min', '15min','30min','1hour','4hour','1day','check_all'];
  
      return {
        options: stocks.map(symbol => ({
          text: {
            type: 'plain_text',
            text: symbol,
          },
          value: symbol,
        })),
      };
    }
  
    return {};
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
  private async CHECKBULL_BEAR_processTickers(
      ticker: string,
      timeframe: string,postToCSLRE
    ) {
      // Prepare ticker promises with concurrency limit
      let data = await this.stockService.TwReveseNOAPI(ticker, timeframe);
      if (!Array.isArray(data) || data.length < 2) {
        await this.sH_Service.sendBatchNotification('START',`${true?'TwReveseNOAPI':'POLYGON2'}-`+`<https://new-site-pwa.web.app/?stockTicker=${ticker}&endpoint=po&timeframe=1day|${ticker}>`,[this.sH_Service.Z_US_SL_.OR4],this.webhooksService,500);
        return;
      }

      let getText = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(ticker,timeframe,data)
      const updateMe = await this.webhooksService.reply_SLack(postToCSLRE.channel, postToCSLRE.ts, `======${getText}=*CLICK_CALL*======`)
      this.sH_Service.railwayBoolen = false
      const fileBuffer = await this.webhooksService.captureChart(
        data,
        ticker,
        'sirv',
        getText,
      );
      let getImageSirv
      if(fileBuffer){
        getImageSirv = await this.sirvService.uploadImage(fileBuffer)
        getText += `\n <${getImageSirv.url}|Chart-${ticker}-${timeframe}>`
        const blocks = [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `======${getText}=*CLICK_CALL*======`,
            },
          },
          {
            type: "image",
            image_url: getImageSirv.url,
            alt_text: `Chart-${ticker}-${timeframe}`,
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: `${ticker}-clear_itself`,
                },
                value: getImageSirv.filename,
                action_id: 'clear_itself',
                style: 'danger',
              },
            ],
          },
          {
            type: "section",
            block_id: ticker,
            text: {
              type: "mrkdwn",
              text: "Select a interval"
            },
            accessory: {
              type: "external_select",
              placeholder: {
                type: "plain_text",
                text: "Search timeframe"
              },
              action_id: "timeframe_interval",
              min_query_length: 1
            }
          }
        ];
        // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'',blocks)
        await this.webhooksService.Update_Slack(postToCSLRE.channel,updateMe.ts,'updateWithimage',blocks)
        this.sH_Service.railwayBoolen = true
      } else {
        await this.webhooksService.Update_Slack(postToCSLRE.channel,updateMe.ts,`======${getText}=*NO IMAGE*======`)
      }
      // const checkSym = (ticker==='QQQ'||ticker === 'SPY')
      // console.log(getImageSirv)
      // if(checkSym){
      //   this.webhooksService.sendSlackNotification(`${getText}=*CLICK_CALL*`, postToCSLRE.channel)
      // }else
      {
        // await this.webhooksService.reply_SLack(
        //   postToCSLRE.channel,
        //   postToCSLRE.ts,
        //   `======${getText}=*CLICK_CALL*======`
        // )
      }

  } async catch (error) {
    // Send error notification and log the error
    await this.webhooksService.sendSlackNotification(`ERORR_CALL`, this.sH_Service.Z_US_SL_.OR4)
  }
}
