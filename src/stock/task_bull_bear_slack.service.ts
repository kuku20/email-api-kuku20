// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
import pLimit from 'p-limit';
@Injectable()
export class TasksBullBearSlackOnLyService {
  allkeys = 'all'; // test
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly sH_Service: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksBullBearSlackOnLyService.name);
  endpointFolder = 'stock-price-check';
  runOnceAtOpen = false
  aboveList = []
  aboveListUP = []
  belowList = []
  belowListUp = []
  async onModuleInit() {
    const addToDailyRun = await this.LocalPLWR.FireBaseApi('get',`stock-related/addToDailyRun.json`,'')
    const moreSymbols = Object.keys(addToDailyRun)
    console.log('moreSymbols',moreSymbols)
    const todayMostGains = await this.LocalPLWR.FireBaseApi('get',`${this.sH_Service.todayUpGains}.json`,'')
    const moreSymbols2 = Object.keys(todayMostGains)
    console.log('todayMostGains',moreSymbols2)
    // this.sH_Service.bullbearDaily = this.sH_Service.bullbearUqiue
    // await this.CHECKBULL_5_15_30_1h(['ORCL','UNH','SOXX'],0)
    //  await this.CHECKBULL_BEAR_OTHER_5MIN(0)
  }

  @Cron('*/5 9-16 * * 1-5', { timeZone: 'America/New_York' }) // washlist
  async CHECKBULL_BEAR_OTHER_5MIN(delay = 2) {
    await this.sH_Service.sendBatchNotification('START','checking',[this.sH_Service.Z_US_SL_.OR],this.webhooksService,100,);
    await this.CHECKBULL_BEAR_OTHER(delay);
  }

  async CHECKBULL_BEAR_OTHER(delay=2,symbols= DataSymbols.watchlist){
    if (!this.sH_Service.shouldRunTradingLogicUS('5min',this.logger)) {
      return;
    }
    this.sH_Service.bullbearDaily = this.sH_Service.bullbearUqiue
    this.sH_Service.slackPosted = []
    this.sH_Service.apitwelveCount = 0
    try {
      const addToDailyRun = await this.LocalPLWR.FireBaseApi('get',`stock-related/addToDailyRun.json`,'')
      const moreSymbols = Object.keys(addToDailyRun)
      const todayMostGains = await this.LocalPLWR.FireBaseApi('get',`${this.sH_Service.todayUpGains}.json`,'')
      const moreSymbols2 = Object.keys(todayMostGains)

      const uniqueCombine =  Array.from(new Set([...moreSymbols, ...symbols]))
      await this.CHECKBULL_5_15_30_1h(uniqueCombine,delay)
    } catch (error) {
      console.error('timeframe failed:', error);
      throw error;
    } finally{
      console.log(this.sH_Service.apitwelveCount)
      // const webhooks = Object.values(this.sH_Service.INTRA_30M_SL_)
      const webhooks = Array.from(new Set([...this.sH_Service.slackPosted]))
      await this.sH_Service.sendBatchNotification('START','dailyrunon5min',webhooks,this.webhooksService,300,);
      this.sH_Service.bullbearDaily = 'setto0'
    }
  }

  async CHECKBULL_5_15_30_1h(
    tickers: string[],
    delay = 2,
  ) {
    this.sH_Service.ALL_IN_ONE = true
    const limit = pLimit(4); // Limit the concurrency to 8 at a time

    const washselllists =[...(await this.LocalPLWR.loadWashSellList()) ||
      this.LocalPLWR.getWashSellList(),'QQQ','SPY'];
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));

    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {
        if (washselllists?.includes(ticker)) {
          console.log(`⏭️ Skipping ${ticker} — in wash sell list`);
          return; // Skip this ticker and move on
        }
        const checktext = 'AB🟢🟢BUYY🟢🟢'
        try {
          let FullText = '';
          let bullishCount = 0;
          let bullishFCount = 0;
          let aboveCount = 0;
          const timeframe = '5min'
          const data_5min = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
          const last5min = data_5min[data_5min.length-1]
          const isWithinRange = this.webhooksService.checktimeMinutesEST(
            ticker,
            last5min?.date,
            10,
          );
          const getLastTimePost = this.webhooksService.getTsBySymbol(ticker,this.sH_Service.lastPosted)
          const match = getLastTimePost?.ts ===  last5min?.date
          if (!isWithinRange || match) {
            await this.webhooksService.sendSlackNotification(`*T*wReveseNOAPI** <https://new-site-pwa.web.app/?stockTicker=${ticker}&endpoint=po&timeframe=1day|${ticker}> |${last5min.close}|${last5min?.date}* || ${getLastTimePost?.ts}`,this.sH_Service.Z_US_SL_.OR4);
            await this.sH_Service.sleep(500);
            return this.CHECKBULL_5_Tiiingo([ticker],0);
          }
          const text_5min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
              ticker,
              timeframe,
              data_5min
          );
          const MACDP = last5min.divergence > 0
          const closeCrosMA50 = last5min.close > last5min.MA50 && data_5min[data_5min.length-2].close < data_5min[data_5min.length-2].MA50
          const closeCrosMA200 = last5min.close > last5min.MA200 && data_5min[data_5min.length-2].close < data_5min[data_5min.length-2].MA200

          FullText += `${text_5min}\n`;
          if(text_5min.includes('BIG_🟡🟡_VOL') && text_5min.includes('bar_🟢_green')){
            // && text_5min.includes('AB🟢🟢BUYY🟢🟢')
            const data_15min = await this.LocalPLWR.TwReveseNOAPI(ticker, '15min');
            const text_15min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
              ticker,
              '15min',
              data_15min
            );
            FullText += `\n${text_15min}\n`;
            if(true){
              const FTextWInDicator = '*BIG_🟡🟡_VOL*\n'+FullText
              const channelBig_V = DataSymbols.watchlist.includes(ticker) ?this.sH_Service.INTRA_30M_SL_.MACDCR_50:this.sH_Service.INTRA_30M_SL_.MACDCR_BL
              const fileBuffer5m = await this.webhooksService.captureChart(
                data_5min,
                ticker,
                channelBig_V+'-5MIN',
                text_5min,
              );
              const tsNCh = this.webhooksService.getTsBySymbol(ticker, this.sH_Service.watchlistSl_tss) || this.webhooksService.getTsBySymbol(ticker, this.sH_Service.holdingSl_tss);
              const blockreW =  [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: FTextWInDicator ,
                  },
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
              ]
              if(fileBuffer5m){
                const postTo5m  = await this.webhooksService.postSlackImage(
                  channelBig_V,
                  fileBuffer5m,
                  `${ticker}-5min.png`,
                  FTextWInDicator,
                );
                const messageTs = await this.webhooksService.getSlackMessageTs(channelBig_V,postTo5m.files?.[0].id,);
                if (tsNCh) {
                  const signalThread = this.sH_Service.getSlackMessageLink(
                    tsNCh.channel,
                    tsNCh.ts
                  );
                  // reply to self msg
                  await this.webhooksService.reply_SLack(channelBig_V, messageTs, signalThread);
                  // replay to btn-watch ts
                  await this.webhooksService.reply_SLack(tsNCh.channel, tsNCh.ts, FTextWInDicator +`<${postTo5m?.files[0]?.permalink}|image>`,blockreW);
                } else {
                  const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                  await this.webhooksService.reply_SLack(channelBig_V,messageTs,'withBlock',blockre)
                }
                const fileBuffer15m = await this.webhooksService.captureChart(
                  data_15min,
                  ticker,
                  `${channelBig_V}-15MIN`,
                  text_15min,
                );
                if(fileBuffer15m){
                  const postTo15m  = await this.webhooksService.postSlackImage(
                    channelBig_V,
                    fileBuffer15m,
                    `${ticker}-15min.png`,
                    text_15min,
                    messageTs
                  );
                  if(tsNCh){
                    await this.webhooksService.reply_SLack(tsNCh.channel, tsNCh.ts, text_15min +`<${postTo15m?.files[0]?.permalink}|image>`);  
                  } 
                  const msgMySl = FTextWInDicator+  `\n <${this.sH_Service.imageHostUrl}/slack/slack-image/${postTo5m.files?.[0].id}|5m-slackImage>  || <${this.sH_Service.imageHostUrl}/slack/slack-image/${postTo15m.files?.[0].id}|15m-slackImage>  `
                  await this.webhooksService.Post2MySlack(msgMySl, ticker)
                } else {
                  const pathSym = `${channelBig_V}-15MIN/${ticker}`.toUpperCase();
                  const imageWEB = `|| <${this.sH_Service.stockMk000}/capture-target/${pathSym}|prodUrl>`
                  const msgMySl = FTextWInDicator+  `\n <${this.sH_Service.imageHostUrl}/slack/slack-image/${postTo5m.files?.[0].id}|5m-slackImage>  ${imageWEB}`
                  await this.webhooksService.Post2MySlack(msgMySl, ticker)

                  if (tsNCh) {
                    // replay to btn-watch ts
                    await this.webhooksService.reply_SLack(tsNCh.channel, tsNCh.ts, text_15min+imageWEB);
                  } else {
                    const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                    await this.webhooksService.reply_SLack(channelBig_V,messageTs,'withBlock',blockre)
                  }
                }
              } else { // test only and no need 15 to run
                const pathSym = `${channelBig_V}-5MIN/${ticker}`.toUpperCase();
                const msgN_imageWEB = `${FTextWInDicator}\n<${this.sH_Service.stockMk000}/capture-target/${pathSym}|prodUrl>`
                await this.webhooksService.Post2MySlack(msgN_imageWEB, ticker)
                const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
                  timeframe,
                  [ticker],
                  data_5min[data_5min.length-1],
                  channelBig_V,
                  msgN_imageWEB,
                );
              }
              // const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
              //   data_5min,
              //   ticker,
              //   DataSymbols.watchlist.includes(ticker)?this.sH_Service.INTRA_30M_SL_.MACDCR_50:this.sH_Service.INTRA_30M_SL_.MACDCR_BL,
              //   `*${`BIG_🟡🟡_VOL`}*`+`\n${FTextWInDicator} \n`,
              //   '5min',
              //  );

              //  // fix later for big_VOL
              // const replyImage = replyData.imageUrl;
              // if(replyImage){
              //   const chart15m = `<${replyImage}|15-Chart> \n`
              //   await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,chart15m)
              // }
              //  // fix later for big_VOL

              // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
              // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
              // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
            }
          } else if(text_5min.includes('CrAbMA50')){
            let nextText = 'PREPARE_TO_BUY_50:'
            if(text_5min.includes('CrAbMA50CrAbMA120CrAbMA200')){
              nextText = 'BUY_MORE_MORE_200:'
            } else if(text_5min.includes('CrAbMA50CrAbMA120')){
              nextText = 'BUY_MORE_120:'
            }  
            const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
              data_5min,
              ticker,
              DataSymbols.watchlist.includes(ticker)?this.sH_Service.INTRA_30M_SL_.MACDCR_100:this.sH_Service.INTRA_30M_SL_.MACDCR_200,
              `*${nextText}*`+`\n${FullText} \n`,
              '5min',
             );
            // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
            // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
          } else if(text_5min.includes('macdCr_N')){
            const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
              data_5min,
              ticker,
              this.sH_Service.INTRA_30M_SL_.MACDCR_BL,
              `*macdCr_N_be_prepare*`+`\n${FullText} \n`,
              '5min',
             );
          } else if(!text_5min.includes('🔴')){
          // } else if(text_5min.includes(checktext)){
            // send can buy: check macd call the 
            const data_15min = await this.LocalPLWR.TwReveseNOAPI(ticker, '15min');
            const text_15min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
              ticker,
              '15min',
              data_15min
            );
            FullText += `${text_15min}\n`;
            const inWt = DataSymbols.watchlist.includes(ticker) && (text_15min.includes('BUYY🟢🟢')|| text_15min.includes('AB🟢🟢'))
            if(inWt){
            // sent with good to buy check macd 0.1<0.6
              const data_30min = await this.LocalPLWR.TwReveseNOAPI(ticker, '30min');
              const text_30min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
                ticker,
                '30min',
                data_30min
              );
              FullText += `${text_30min}\n`;
              if(text_30min.includes('BUYY🟢🟢')|| text_30min.includes('AB🟢🟢')){
                // sent with good to buy check macd 0.1<0.6
                const data_1hour = await this.LocalPLWR.TwReveseNOAPI(ticker, '1hour');
                const text_1hour = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
                  ticker,
                  '1hour',
                  data_1hour
                );
                FullText += `${text_1hour}\n`;
                // if(!FullText.includes('🔴')){
                if(!text_15min.includes('🔴')&& !text_5min.includes('🔴')){
                  const allGreen = FullText.includes('🔴')?'5_15_allgreen':'ALLGREEN_BE_CAREFULL_FORST'
                  const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                    data_5min,
                    ticker,
                    this.sH_Service.INTRA_30M_SL_.ALLGREEN,
                    `*${allGreen}*`+`\n${FullText} \n`,
                    '5min',
                   );

                  // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                    // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                  if(text_15min.includes(checktext)){
                    await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'heart');
                    if(text_1hour.includes(checktext)){
                      await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'cold_face');
                    }
                  } else if(text_30min.includes('macdCr_N')|| text_15min.includes('macdCr_N')){
                    await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'b');
                  }
                  return
                } else if(text_30min.includes('BUYY🟢🟢')|| text_30min.includes('AB🟢🟢')){
                  // sent with good to buy check macd 0.1<0.6
                                  // send to watchlist
                    const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                      data_5min,
                      ticker,
                      this.sH_Service.INTRA_30M_SL_.WATCH,
                      `*5_allgreen_30BOrAb*`+`\n${FullText} \n`,
                      '5min',
                    );
                  // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                    // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                  if(text_15min.includes(checktext)){
                    await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'heart');
                    if(text_1hour.includes(checktext)){
                      await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'cold_face');
                    }
                  } else if(text_30min.includes('macdCr_N')|| text_15min.includes('macdCr_N')){
                    await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'b');
                  }
                  return
                } else {
                  console.log('stop at 15:5_allgreen_15_red')
                  // buy earlly if 
                  if(MACDP && closeCrosMA50){
                    const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                      data_5min,
                      ticker,
                      this.sH_Service.INTRA_30M_SL_.EARLY_CHECK,
                      `*5_allgreen_15_red_ab50*`+`\n${FullText} \n`,
                      '5min',
                    );
                    // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                    // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                  } else if(MACDP && closeCrosMA200){
                      // data_5min[data_5min.length-1],
                      const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                        data_5min,
                        ticker,
                        this.sH_Service.INTRA_30M_SL_.EARLY_CHECK,
                        `*5_allgreen_15_red_ab200*`+`\n${FullText} \n`,
                        '5min',
                      );
                      // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                      // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                      // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                  }
                  return
                }
              } else {
                console.log('stop at 30:5_allgreen_30_red')
                // buy earlly if 
                if(MACDP && closeCrosMA200){
                  const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                    data_5min,
                    ticker,
                    this.sH_Service.INTRA_30M_SL_.EARLY_CHECK,
                    `*5_allgreen_ab200_30_red*`+`\n${FullText} \n`,
                    '5min',
                  );
                  // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                  // // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                } else if(MACDP ){
                  const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                    data_5min,
                    ticker,
                    this.sH_Service.INTRA_30M_SL_.EARLY_CHECK,
                    `*5_allgreen_30_red*`+`\n${FullText} \n`,
                    '5min',
                  );
                  // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                  // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                }  
                return
              }
            } else if(text_15min.includes('macdCr_N')){
              const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                data_5min,
                ticker,
                this.sH_Service.INTRA_30M_SL_.MACDCR_BL_OT,
                `*15_macdCr_N*`+`\n${FullText} \n`,
                '5min',
              );
              // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
              // // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
              // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
            } else {
              console.log('stop at 15: 5_allgreen')
              // buy earlly if 
              const last5min = data_5min[data_5min.length-1]
              const MACDP = last5min.divergence > 0
              const closeCrosMA50 = last5min.close > last5min.MA50 && data_5min[data_5min.length-2].close < data_5min[data_5min.length-2].MA50
              const closeCrosMA200 = last5min.close > last5min.MA200 && data_5min[data_5min.length-2].close < data_5min[data_5min.length-2].MA200
              if(MACDP && closeCrosMA200){
                  const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                    data_5min,
                    ticker,
                    this.sH_Service.INTRA_30M_SL_.EARLY_CHECK,
                    `*5_allgreen_MA200*`+`\n${FullText} \n`,
                    '5min',
                  );
                  // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                  // // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                } else  if(MACDP ){
                  const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                    data_5min,
                    ticker,
                    this.sH_Service.INTRA_30M_SL_.EARLY_CHECK,
                  `*5_allgreen_MACDP*`+`\n${FullText} \n`,
                    '5min',
                  );
                  // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                  // // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                }  
              return
            }
          } else if(!text_5min.includes('🟢')){
            const data_1hour = await this.LocalPLWR.TwReveseNOAPI(ticker, '1hour');
            const text_1hour = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
              ticker,
              '1hour',
              data_1hour
            );
            FullText += `${text_1hour}\n`;
            if(!text_1hour.includes('🟢')){
              const data_30min = await this.LocalPLWR.TwReveseNOAPI(ticker, '30min');
              const text_30min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
                ticker,
                '30min',
                data_30min
              );
              FullText += `${text_30min}\n`;
              let displaytext = '5_15_all_red'
              if(!text_30min.includes('🟢')){
                const data_15min = await this.LocalPLWR.TwReveseNOAPI(ticker, '15min');
                const text_15min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
                  ticker,
                  '15min',
                  data_15min
                );
                FullText += `${text_15min}\n`;
                if(!text_15min.includes('🟢')){
                  const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                    data_5min,
                    ticker,
                    this.sH_Service.INTRA_30M_SL_.D_DOWN,
                    `*${displaytext}*`+`\n${FullText} \n`,
                    '5min',
                  );
                }
              }
            }

          } else {
            console.log('stop at 5', FullText)
            return
          }
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ${error.message} \n url: ${this.sH_Service.local4200}/price-log/${ticker}?daysRange=500`,
            `RSIENDBOT ${ticker} at fullList`,
            'Nono',
            'ERORR_CALL',
          );
          
          this.logger.error(`Error processing ${ticker}: ${error.message}`);
        }
      }),
    );

    // Wait for all ticker promises to complete concurrently (with concurrency limit)
    await Promise.all(tickerPromises);
    // this.sH_Service.ALL_IN_ONE = false
  }

  async CHECKBULL_5_Tiiingo(
    tickers: string[],
    delay = 2,
  ) {
    this.sH_Service.ALL_IN_ONE = true
    const limit = pLimit(4); // Limit the concurrency to 8 at a time

    const washselllists =[...(await this.LocalPLWR.loadWashSellList()) ||
      this.LocalPLWR.getWashSellList(),'QQQ','SPY'];
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));

    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {
        if (washselllists?.includes(ticker)) {
          console.log(`⏭️ Skipping ${ticker} — in wash sell list`);
          return; // Skip this ticker and move on
        }
        const checktext = 'AB🟢🟢BUYY🟢🟢'
        try {
          let FullText = '';
          const timeframe = '5min'
          const data_5min = await this.LocalPLWR.tiingo_US(ticker, timeframe);
          const last5min = data_5min[data_5min.length-1]
          const isWithinRange = this.webhooksService.checktimeMinutesCST(
            ticker,
            last5min?.date,
            10,
          );
          const getLastTimePost = this.webhooksService.getTsBySymbol(ticker,this.sH_Service.lastPosted)
          const match = getLastTimePost?.ts ===  last5min?.date
          if (!isWithinRange || match) {
            await this.webhooksService.sendSlackNotification(`**tiingo_US* <https://new-site-pwa.web.app/?stockTicker=${ticker}&endpoint=po&timeframe=1day|${ticker}> |${last5min.close}|${last5min?.date}* || ${getLastTimePost?.ts}`,this.sH_Service.Z_US_SL_.OR4);
            await this.sH_Service.sleep(500);
            return 0
          }
          const text_5min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
              ticker,
              timeframe,
              data_5min
          );
          FullText += `*tiingo_US*\n ${text_5min}\n`;
          if(text_5min.includes('BIG_🟡🟡_VOL') && text_5min.includes('bar_🟢_green')){
            if(true){
              const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                data_5min,
                ticker,
                DataSymbols.watchlist.includes(ticker)?this.sH_Service.INTRA_30M_SL_.MACDCR_50:this.sH_Service.INTRA_30M_SL_.MACDCR_BL,
                `*${`BIG_🟡🟡_VOL`}*`+`\n${FullText} \n`,
                '5min',
               );
              //  // fix later for big_VOL
              //  const fileBuffer15m = await this.webhooksService.captureChart(
              //   data_15min,
              //   ticker,
              //   DataSymbols.watchlist.includes(ticker)?'US_EARLY_15MIN': 'US_15M_HT',
              //   text_15min,
              // );
              // const replyImage = replyData.imageUrl;
              // if(replyImage){
              //   const chart15m = `<${replyImage}|15-Chart> \n`
              //   await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,chart15m)
              // }
              //  // fix later for big_VOL

              // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
              // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
              // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
            }
          } else if(text_5min.includes('CrAbMA50')){
            let nextText = 'PREPARE_TO_BUY_50:'
            if(text_5min.includes('CrAbMA50CrAbMA120CrAbMA200')){
              nextText = 'BUY_MORE_MORE_200:'
            } else if(text_5min.includes('CrAbMA50CrAbMA120')){
              nextText = 'BUY_MORE_120:'
            }  
            const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
              data_5min,
              ticker,
              DataSymbols.watchlist.includes(ticker)?this.sH_Service.INTRA_30M_SL_.MACDCR_100:this.sH_Service.INTRA_30M_SL_.MACDCR_200,
              `*${nextText}*`+`\n${FullText} \n`,
              '5min',
             );
            // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
            // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
          } else if(text_5min.includes('macdCr_N')){
            const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
              data_5min,
              ticker,
              this.sH_Service.INTRA_30M_SL_.MACDCR_BL,
              `*macdCr_N_be_prepare*`+`\n${FullText} \n`,
              '5min',
             );
          } else if(!text_5min.includes('🔴')){
              console.log('stop at 15: 5_allgreen')
              // buy earlly if 
              const last5min = data_5min[data_5min.length-1]
              const MACDP = last5min.divergence > 0
              const closeCrosMA50 = last5min.close > last5min.MA50 && data_5min[data_5min.length-2].close < data_5min[data_5min.length-2].MA50
              const closeCrosMA200 = last5min.close > last5min.MA200 && data_5min[data_5min.length-2].close < data_5min[data_5min.length-2].MA200
              if(MACDP && closeCrosMA200){
                  const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                    data_5min,
                    ticker,
                    this.sH_Service.INTRA_30M_SL_.EARLY_CHECK,
                    `*5_allgreen_MA200*`+`\n${FullText} \n`,
                    '5min',
                  );
                  // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                  // // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                } else  if(MACDP ){
                  const postToCSLRE  = await this.webhooksService.getImageN_PSlack( 
                    data_5min,
                    ticker,
                    this.sH_Service.INTRA_30M_SL_.EARLY_CHECK,
                  `*5_allgreen_MACDP*`+`\n${FullText} \n`,
                    '5min',
                  );
                  // const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                  // // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  // await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                }  
              return
          } else {
            console.log('stop at 5', FullText)
            return
          }
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ${error.message} \n url: ${this.sH_Service.local4200}/price-log/${ticker}?daysRange=500`,
            `RSIENDBOT ${ticker} at fullList`,
            'Nono',
            'ERORR_CALL',
          );
          
          this.logger.error(`Error processing ${ticker}: ${error.message}`);
        }
      }),
    );

    // Wait for all ticker promises to complete concurrently (with concurrency limit)
    await Promise.all(tickerPromises);
    // this.sH_Service.ALL_IN_ONE = false
  }
}