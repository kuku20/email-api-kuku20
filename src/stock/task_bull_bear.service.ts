// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
import pLimit from 'p-limit';
@Injectable()
export class TasksBullBearService {
  allkeys = 'all'; // test
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksBullBearService.name);
  endpointFolder = 'stock-price-check';
  runOnceAtOpen = false
  aboveList = []
  aboveListUP = []
  belowList = []
  belowListUp = []
  async onModuleInit() {

    // const holdingObj = await this.LocalPLWR.FireBaseApi('get',`stock-related/holding.json`,'')
    // console.log(holdingObj)
    // const allkeys = Object.keys(holdingObj)
    // console.log(allkeys)
    // const priceOfS = holdingObj[allkeys[0]].price
    // console.log(priceOfS)
    // await allkeys.forEach(async symbol=>{
    //   this.webhooksService.fePostToHold2(symbol,holdingObj[symbol].price,'more_options')
    // })
    // await Object.values(this.stockHelperService.BULL_BEAR_SL_).forEach(async symbol=>{
    //   console.log(symbol)
    // this.webhooksService.fePostToHold2(symbol,null,'accessory_price_check',symbol)
    // })
    // this.webhooksService.fePostToHold2('QQQ',null,'accessory_price_check',this.stockHelperService.BULL_BEAR_SL_.QQQ)
    // for (const symbol of DataSymbols.watchlist) {
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    
    //   await this.webhooksService.fePostToHold2(
    //     symbol,
    //     null,
    //     'more_options',
    //     this.stockHelperService.BTN_SL.WATCH
    //   );
    // }

    // await this.webhooksService.fePostToHold2('HAS',holdingObj['HAS'].price,'more_options',this.stockHelperService.BTN_SL.HOLDING)
    // this.logger.warn('Running getholdingList with stocklist length:', symbols);
    // await this.postInteractiveText(this.stockHelperService.BTN_SL.WATCH,DataSymbols.watchlist)
    // console.log(`✅ Loaded stock-related/holding: has ${this.stockHelperService.HoldingList}`);
    // this.stockHelperService.setSlackToken('SLACK_USER_TOKEN');

    // await this.postSLTest(Object.values(this.stockHelperService.INTRA_30M_SL_))
    // await this.postSLTest([''])
    // await this.postSLTest([], 300)
    // // // await this.postDeleteBtn()


    //  await this.dailyCleanup()
    //  console.log('done')
    // await this.webhooksService.deleteSLChannel([this.stockHelperService.BTN_SL.WATCH])

    // const forRundaily2 = await this.LocalPLWR.FireBaseApi('get',`stock-related/forRundaily-po5b/4hour.json`,'')
    // const allkeys2 = Object.keys(forRundaily2)
    // console.log(allkeys2.length)
    // await this.CHECKBULL_BEAR_OTHER(0,allkeys2);

    // const uniqueCombine =  Array.from(new Set([...allkeys, ...DataSymbols.watchlist]))
    // console.log(uniqueCombine.length)
    // await this.delete(-1)
    // await this.delete(0)
    // await this.bullBear('15',0);
    // await this.bullBear('30',0);
    // await this.CHECKBULL_BEAR_OTHER(0,);
    // await this.CHECKBULL_5_15_30_1h(0)
  }

  async  USTIMERUN(
    intickers: string[],
    api: any,
    B_Channel,
    HT_Channel,
    delay,
    timeframe = '5min',
  ) {
    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
    });
    if (intickers.length < 1) {
      this.logger.log(`Don't have symbol ${timeframe} check (${now} ET)`);
      return;
    }
    if (!this.stockHelperService.isMarketOpen()) {
      this.logger.log(
        `🕒 Market closed — skipping ${timeframe} check (${now} ET)`,
      );
      return;
    }
    this.logger.log(
      `✅ Market open — running ${timeframe} trading logic (${now} ET)`,
    );
    await this.webhooksService.SendDcChannels([B_Channel, HT_Channel,],this.logger,'START='+timeframe);
    const tickers = intickers;
    await this.processTickers(
      tickers,
      timeframe,
      api,
      B_Channel,
      HT_Channel,
      delay,
    );
    await this.webhooksService.SendDcChannels([B_Channel, HT_Channel,],this.logger,'END='+timeframe);
  }

  private async processTickers(
    tickers: string[],
    timeframe: string,
    apikey: string,
    B_Channel,
    HT_Channel,
    delay = 2,
  ) {
    const limit = pLimit(8); // Limit the concurrency to 8 at a time

    const washselllists =
      (await this.LocalPLWR.loadWashSellList()) ||
      this.LocalPLWR.getWashSellList();
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));

    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {
        if (washselllists?.includes(ticker)) {
          console.log(`⏭️ Skipping ${ticker} — in wash sell list`);
          return; // Skip this ticker and move on
        }

        try {
          let data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];
          const condition = lastData.divergence > 0 && secondLastData.divergence < 0
          const lastStochRSI = lastData.StochRSI_K > lastData.StochRSI_D 
          const preStockRSI = secondLastData.StochRSI_K < secondLastData.StochRSI_D 
          const StochRSICross = preStockRSI && lastStochRSI

          const lastMA9overMA15 = lastData.MA9 > lastData.MA15 
          const sndMA9overMA15 =  secondLastData.MA9 < secondLastData.MA15 
          const MA9crosMA20 = lastMA9overMA15 && sndMA9overMA15

          const aboveOrBelowma50 = lastData.close > lastData.MA200
          const oneTimeAt9h30 =lastData.date.includes('09:30:00')&& lastData.close >= lastData.MA9 && lastData.MA9 >= lastData.MA15 && lastData.MA15 >= lastData.MA50 && lastData.MA50 >= lastData.MA100 && lastData.MA100 >= lastData.MA200 && lastData.MA200 >= lastData.MA300
          const textDetail = oneTimeAt9h30?'Above all buy':StochRSICross?'StochRSICross': condition && aboveOrBelowma50?'CrossnAb200':''
          const blMa200MACDPMA50cR = lastData.close < lastData.MA200 && lastData.divergence > 0 && (lastData.close > lastData.MA50 && secondLastData.close < secondLastData.MA50)
          const macdCrossAB = lastData.divergence > 0 && secondLastData.divergence < 0
          if(oneTimeAt9h30){
            await this.webhooksService.sendSlackNotificationVN(
              timeframe,
              [ticker],
              lastData,
              this.stockHelperService.INTRA_30M_SL_.MACDCR_200,
              this.stockHelperService.bullbearUqiue+textDetail,
            );
            await this.webhooksService.sendDiscord(
              `${textDetail}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}-${textDetail}`,
              lastData,
              'WATCHLIST', 
              data,
            );
            return
          }
          // else if((StochRSICross || condition && aboveOrBelowma50)){
          //   await this.webhooksService.sendSlackNotificationVN(
          //     timeframe,
          //     [ticker],
          //     lastData,
          //     StochRSICross?this.stockHelperService.INTRA_30M_SL_.MACDCR_50:this.stockHelperService.INTRA_30M_SL_.MACDCR_100,
          //     this.stockHelperService.bullbearUqiue+textDetail+' ',
          //   );
          //   this.aboveList.push(ticker)
          //   await this.webhooksService.sendDiscord(
          //     `${textDetail}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
          //     `${ticker}-ON-${timeframe}-${textDetail}`,
          //     lastData,
          //     StochRSICross?B_Channel:HT_Channel, 
          //     data,
          //   );
          // }
          else if(blMa200MACDPMA50cR){
            await this.webhooksService.sendSlackNotificationVN(
              timeframe,
              [ticker],
              lastData,
              this.stockHelperService.INTRA_30M_SL_.WATCH,
              this.stockHelperService.bullbearUqiue+'blMa200MACDPMA50cR',
            );
            await this.webhooksService.sendDiscord(
              `${'blMa200MACDPMA50cR'}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}-${'blMa200MACDPMA50cR'}`,
              lastData,
              'US_15M_HT', 
              data,
            );
          } 
          // else if(MA9crosMA20){
          //   await this.webhooksService.sendSlackNotificationVN(
          //     timeframe,
          //     [ticker],
          //     lastData,
          //     this.stockHelperService.INTRA_30M_SL_.WATCH,
          //     this.stockHelperService.bullbearUqiue+'MA9crosMA20',
          //   );
          //   await this.webhooksService.sendDiscord(
          //     `${'MA9crosMA20'}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
          //     `${ticker}-ON-${timeframe}-${'MA9crosMA20'}`,
          //     lastData,
          //     'US_15M_HT', 
          //     data,
          //   );
          // } 
          else if(macdCrossAB){
            await this.webhooksService.sendSlackNotificationVN(
              timeframe,
              [ticker],
              lastData,
              this.stockHelperService.INTRA_30M_SL_.MACDCR_BL,
              this.stockHelperService.bullbearUqiue+'macdCrossAB',
            );
            await this.webhooksService.sendDiscord(
              `${'macdCrossAB'}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}-${'macdCrossAB'}`,
              lastData,
              'US_30M_HT', 
              data,
            );
           }
          this.logger.log(`${ticker} processed successfully.`);
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ${error.message} \n url: http://localhost:4200/price-log/${ticker}?daysRange=500`,
            `RSIENDBOT ${ticker} at ${timeframe}`,
            'Nono',
            'ERORR_CALL',
          );
          
          this.logger.error(`Error processing ${ticker}: ${error.message}`);
        }
      }),
    );

    // Wait for all ticker promises to complete concurrently (with concurrency limit)
    await Promise.all(tickerPromises);
  }

  // @Cron('*/15 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async bullBear_5MIN() {
    await this.bullBear('15',3);
  }

  // @Cron('*/30 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async bullBear_15MIN() {
    await this.bullBear('30',4);
  }

  async bullBear(timeframe :'30'|'15'|'5'|'60'= '15',delay = 3, symbols= DataSymbols.watchlist){
    if (!this.stockHelperService.shouldRunTradingLogicUS(`${timeframe}min`,this.logger)) {
      return;
    }
    const time = new Date().toLocaleString('en-US', {timeZone: 'America/New_York',});
    try {
      await this.USTIMERUN(
        symbols,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
        delay,
        `${timeframe}min`,
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
      await Promise.all(
        Object.values(this.stockHelperService.INTRA_30M_SL_).map((hook) =>
          this.webhooksService.sendSlackNotification(`${time}===${timeframe}min=============================`, hook),
        ),
      );
      this.runOnceAtOpen = false
      const percentof = this.aboveListUP.length/this.aboveList.length
      const percentofeve = this.belowListUp.length/this.belowList.length
      this.logger.log(percentof)
      this.logger.error(percentofeve)
    }
  }

  async delete(dayago = 1) {
    const yesterday = this.stockHelperService.getDateNDaysAgo(dayago);
    const Channels = [
      'US_ALL','USSTOCK_WATCH','WATCHLIST','US_15M_HT'
    ]; // example list

    await new Promise((resolve) => setTimeout(resolve, 0 * 60 * 1000));
    for (const channel of Channels) {
      // Log completion
      this.logger.error(`✅ Finished sending for`, channel, yesterday);

      // DELETE two days ago messages
      await this.webhooksService.deleteMessages(channel, yesterday);
      this.logger.error(`🗑️ Deleted old messages for`, channel, yesterday);
    }
  }


  @Cron('*/5 9-16 * * 1-5', { timeZone: 'America/New_York' }) // washlist
  async CHECKBULL_BEAR_OTHER_5MIN() {
    await this.CHECKBULL_BEAR_OTHER(1.5);
    const webhooks = [this.stockHelperService.INTRA_30M_SL_.WATCH,
      this.stockHelperService.INTRA_30M_SL_.MACDCR_100,
      this.stockHelperService.INTRA_30M_SL_.MACDCR_50,
    ]
    await this.stockHelperService.sendBatchNotification('START','4hour',webhooks,this.webhooksService,300,);
  }

  // @Cron('*/15 9-16 * * 1-5', { timeZone: 'America/New_York' }) // other list at 15min
  async CHECKBULL_BEAR_OTHER_15MIN() {
    const forRundaily2 = await this.LocalPLWR.FireBaseApi('get',`stock-related/forRundaily-po5b/4hour.json`,'')
    const allkeys2 = Object.keys(forRundaily2)
    await this.CHECKBULL_BEAR_OTHER(3,allkeys2);
    const webhooks = [this.stockHelperService.INTRA_30M_SL_.MACDCR_BL,
        this.stockHelperService.INTRA_30M_SL_.MACDCR_200,
        this.stockHelperService.INTRA_30M_SL_.MACDCR_BL_OT,
      ]
    await this.stockHelperService.sendBatchNotification('START','4hour',webhooks,this.webhooksService,300,);
  }

  async CHECKBULL_BEAR_OTHER(delay=2,symbols= DataSymbols.watchlist){
    this.stockHelperService.apitwelveCount = 0
    if (!this.stockHelperService.shouldRunTradingLogicUS('5min',this.logger)) {
      return;
    }
    try {
      await this.CHECKBULL_5_15_30_1h(symbols,delay)
    } catch (error) {
      console.error('timeframe failed:', error);
      throw error;
    } finally{
      console.log(this.stockHelperService.apitwelveCount)
    }
  }

  async CHECKBULL_5_15_30_1h(
    tickers: string[],
    delay = 2,
  ) {
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
          const text_5min = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(
              ticker,
              timeframe,
              data_5min
          );
          FullText += `${text_5min}\n`;
          if(text_5min.includes('CrAbMA')){
            let nextText = ''
            if(text_5min.includes('CrAbMA50')){
              nextText = 'PREPARE TO BUY:'
            } else if(text_5min.includes('CrAbMA120')){
              nextText = 'BUY MORE:'
            } else if(text_5min.includes('CrAbMA200')){
              nextText = 'BUY MORE MORE: '
            }
            await this.webhooksService.sendDiscord(
              nextText+FullText,
              `${ticker}-ON-${timeframe}-${'macdCrossAB'}`,
              data_5min[data_5min.length-1],
              DataSymbols.watchlist.includes(ticker)?'US_EARLY_5MIN': 'US_5M_HT',
              data_5min,
            );
            
            const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
              '5min',
              [ticker],
              data_5min[data_5min.length-1],
              DataSymbols.watchlist.includes(ticker)?this.stockHelperService.INTRA_30M_SL_.MACDCR_100:this.stockHelperService.INTRA_30M_SL_.MACDCR_200,
              `\n${FullText} \n`
            );
            const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
            await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
          }
          if(text_5min.includes('BIG_🟡🟡_VOL') && text_5min.includes('bar_🟢_green') && text_5min.includes('AB🟢🟢BUYY🟢🟢')){
            const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
              '5min',
              [ticker],
              data_5min[data_5min.length-1],
              DataSymbols.watchlist.includes(ticker)?this.stockHelperService.INTRA_30M_SL_.MACDCR_50:this.stockHelperService.INTRA_30M_SL_.MACDCR_BL,
              `\n${FullText} \n`
            );
            const blockre = this.webhooksService.getSlBlock(ticker,'accessory_price_check',ticker)
              // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
            await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
            await this.webhooksService.sendDiscord(
              FullText,
              `${ticker}-ON-${timeframe}-${'macdCrossAB'}`,
              data_5min[data_5min.length-1],
              DataSymbols.watchlist.includes(ticker)?'US_EARLY_15MIN': 'US_15M_HT',
              data_5min,
            );
          }
          else if(text_5min.includes(checktext)){
            // send can buy: check macd call the 
            const data_15min = await this.LocalPLWR.TwReveseNOAPI(ticker, '15min');
            const text_15min = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(
              ticker,
              '15min',
              data_15min
            );
            FullText += `${text_15min}\n`;
            const inWt = DataSymbols.watchlist.includes(ticker) && (text_15min.includes('BUYY🟢🟢')|| text_15min.includes('AB🟢🟢'))
            if(inWt){
            // sent with good to buy check macd 0.1<0.6
              const data_30min = await this.LocalPLWR.TwReveseNOAPI(ticker, '30min');
              const text_30min = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(
                ticker,
                '30min',
                data_30min
              );
              FullText += `${text_30min}\n`;
              if(text_30min.includes('BUYY🟢🟢')|| text_30min.includes('AB🟢🟢')){
                // sent with good to buy check macd 0.1<0.6
                const data_1hour = await this.LocalPLWR.TwReveseNOAPI(ticker, '1hour');
                const text_1hour = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(
                  ticker,
                  '1hour',
                  data_1hour
                );
                FullText += `${text_1hour}\n`;
                if(text_30min.includes('BUYY🟢🟢')|| text_30min.includes('AB🟢🟢')){
                  // sent with good to buy check macd 0.1<0.6
                                  // send to watchlist
                  await this.webhooksService.sendDiscord(
                    FullText,
                    `${ticker}-ON-${timeframe}-${'macdCrossAB'}`,
                    data_5min[data_5min.length-1],
                    'US_30M_BUY', 
                    data_5min,
                  );
                  const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
                    '5min',
                    [ticker],
                    data_5min[data_5min.length-1],
                    this.stockHelperService.INTRA_30M_SL_.WATCH,
                    `\n${FullText} \n`
                  );
                  const blockre = this.webhooksService.getSlBlock(ticker,'accessory_price_check',ticker)
                    // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                  if(text_15min.includes(checktext)){
                    await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'heart');
                    if(text_1hour.includes(checktext)){
                      await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'cold_face');
                    }
                  } else if(text_30min.includes('macdCr_N')|| text_15min.includes('macdCr_N')){
                    await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'b');
                  }
                  return
                }
              } 
              else {
                console.log('stop at 30')
                return
              }
            } else if(text_15min.includes('macdCr_N')){
              const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
                '5min',
                [ticker],
                data_5min[data_5min.length-1],
                this.stockHelperService.INTRA_30M_SL_.MACDCR_BL_OT,
                `\n${FullText} \n`
              );
              await this.webhooksService.sendDiscord(
                FullText,
                `${ticker}-ON-${timeframe}-${'macdCrossAB'}`,
                data_5min[data_5min.length-1],
                'US_30M_HT', 
                data_5min,
              );
            } else {
              console.log('stop at 15')
              return
            }
          } else {
            console.log('stop at 5')
            return
          }
          // const timeframes = [
          //   '5min',
          //   '15min',
          //   '30min',
          //   '1hour',
          // ];
          // for (const tf of timeframes) {
          //   const data = await this.LocalPLWR.TwReveseNOAPI(ticker, tf);
          
          //   if (!data?.length) {
          //     break;
          //   }
          
          //   const text = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(
          //     ticker,
          //     tf,
          //     data
          //   );
          
          //   bullishCount++;
          //   FullText += `${text}\n`;
          //   if(text.includes('AB🟢🟢')){
          //     aboveCount++
          //   }
          //   if (text.includes('AB🟢🟢BUYY🟢🟢')) {
          //     bullishFCount++;
          //     if(bullishFCount>2){
          //       // this.webhooksService.sendSlackNotification(`\n ${ticker}: ${bullishCount}/${timeframes.length} bullish`+FullText, this.stockHelperService.INTRA_30M_SL_.WATCH)
          //       const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
          //         '5min',
          //         [ticker],
          //         data[data.length-1],
          //         this.stockHelperService.INTRA_30M_SL_.WATCH,
          //         `\n${FullText} \n`
          //       );
          //       const blockre = this.webhooksService.getSlBlock(ticker,'accessory_price_check',ticker)
          //       // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
          //       await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
          //       await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'heart');
          //       break;
          //     }
          //   }
          //   if(bullishCount>3){
          //     // this.webhooksService.sendSlackNotification(`\n ${ticker}: ${bullishCount}/${timeframes.length} bullish`+FullText, this.stockHelperService.INTRA_30M_SL_.WATCH)
          //     const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
          //       '5min',
          //       [ticker],
          //       data[data.length-1],
          //       this.stockHelperService.INTRA_30M_SL_.WATCH,
          //       `\n${FullText} \n`
          //     );
          //     const blockre = this.webhooksService.getSlBlock(ticker,'accessory_price_check',ticker)
          //     // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
          //     await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
          //     break;
          //   }
          //   if (!text.includes('BUYY🟢🟢')) {
          //     if(bullishFCount>0&& aboveCount>1){
          //       const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
          //         '5min',
          //         [ticker],
          //         data[data.length-1],
          //         this.stockHelperService.INTRA_30M_SL_.WATCH,
          //         `\n${FullText} \n`
          //       );
          //       const blockre = this.webhooksService.getSlBlock(ticker,'accessory_price_check',ticker)
          //       // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
          //       await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
          //       await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'cold_face');
          //       break;
          //     }  
          //     break;
          //   }
          // }
          
          // this.logger.log(`${ticker}: ${bullishCount}/${timeframes.length} bullish`);
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ${error.message} \n url: http://localhost:4200/price-log/${ticker}?daysRange=500`,
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
  }

  async postSLTest(webhooks =[ 'C0B77K2AG12','C0B6BFBKJ4X'],timewait = 1000) {
    // await this.stockHelperService.sendBatchNotification('START','test',webhooks,this.webhooksService,timewait,);
    this.stockHelperService.sendBatchNotification('START','test',Object.values(this.stockHelperService.US_DAILY_),this.webhooksService,timewait,)
    this.stockHelperService.sendBatchNotification('START','test',Object.values(this.stockHelperService.US_4H_),this.webhooksService,timewait,)
    this.stockHelperService.sendBatchNotification('START','test',Object.values(this.stockHelperService.VN_SL_),this.webhooksService,timewait,)
    this.stockHelperService.sendBatchNotification('START','test',Object.values(this.stockHelperService.Z_US_SL_),this.webhooksService,timewait,)
    this.stockHelperService.sendBatchNotification('START','test',Object.values(this.stockHelperService.AI_SL),this.webhooksService,timewait,)
    this.stockHelperService.sendBatchNotification('START','test',Object.values(this.stockHelperService.INTRA_30M_SL_),this.webhooksService,timewait,)
    this.stockHelperService.sendBatchNotification('START','test',Object.values(this.stockHelperService.BULL_BEAR_SL_),this.webhooksService,timewait,)
  }

  async postInteractiveText(webhook, symbols) {
    await symbols.forEach(async symbol=>{
     await this.webhooksService.post2SlackBtnFn(webhook,symbol)
    })
  }
  async postDeleteBtn() {
    const channels = [...Object.values(this.stockHelperService.US_DAILY_), 
      ...Object.values(this.stockHelperService.US_4H_), 
      ...Object.values(this.stockHelperService.VN_SL_), 
      ...Object.values(this.stockHelperService.Z_US_SL_), 
      ...Object.values(this.stockHelperService.AI_SL), 
      ...Object.values(this.stockHelperService.INTRA_30M_SL_), 
      ...Object.values(this.stockHelperService.BULL_BEAR_SL_), 
      ...Object.values(this.stockHelperService.BTN_SL)];
    await channels.forEach(async channel=>{
        await this.webhooksService.fePostToHold2(
          'QQQ',
          null,
          'clear_each',
          channel
      );
    })
          // await this.webhooksService.fePostToHold2(
      //   'QQQ',
      //   null,
      //   'clear_each',
      //   this.stockHelperService.BTN_SL.WATCH
      // );
  }

  // @Cron('0 19 * * 1-5', { timeZone: 'America/New_York' }) // Every weekday at 7:00 PM New York time
  async dailyCleanup() {    
    this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.US_DAILY_))
    this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.US_4H_))
    this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.VN_SL_))
    this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.Z_US_SL_))
    this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.AI_SL))
    this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.INTRA_30M_SL_))
    this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.BULL_BEAR_SL_))
    this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.BTN_SL))
  }
}