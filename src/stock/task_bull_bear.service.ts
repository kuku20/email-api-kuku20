// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
import pLimit from 'p-limit';
import { Stratery_2Service } from './strategy/strategy2.service';
@Injectable()
export class TasksBullBearService {
  allkeys = 'all'; // test
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly sH_Service: StockHelperService,
    private readonly stratery_2Service: Stratery_2Service,
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
    const addToDailyRun = await this.LocalPLWR.FireBaseApi('get',`stock-related/addToDailyRun.json`,'')
    const moreSymbols = Object.keys(addToDailyRun)
    console.log('moreSymbols',moreSymbols)
    const todayMostGains = await this.LocalPLWR.FireBaseApi('get',`${this.sH_Service.todayUpGains}.json`,'')
    const moreSymbols2 = Object.keys(todayMostGains)
    console.log('todayMostGains',moreSymbols2)
    // const holdingObj = await this.LocalPLWR.FireBaseApi('get',`stock-related/holding.json`,'')
    // console.log(holdingObj)
    // const allkeys = Object.keys(holdingObj)
    // console.log(allkeys)
    // const priceOfS = holdingObj[allkeys[0]].price
    // console.log(priceOfS)
    // await allkeys.forEach(async symbol=>{
    //   this.webhooksService.fePostToHold2(symbol,holdingObj[symbol].price,'more_options')
    // })
    // await Object.values(this.sH_Service.BULL_BEAR_SL_).forEach(async symbol=>{
    //   console.log(symbol)
    // this.webhooksService.fePostToHold2(symbol,null,'accessory_price_check',symbol)
    // })
    // this.webhooksService.fePostToHold2('SPY',null,'accessory_price_check',this.sH_Service.BULL_BEAR_SL_.SPY)
    // this.webhooksService.fePostToHold2('QQQ',null,'accessory_price_check',this.sH_Service.BULL_BEAR_SL_.QQQ)
    // for (const symbol of DataSymbols.watchlist) {
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    
    //   await this.webhooksService.fePostToHold2(
    //     symbol,
    //     null,
    //     'more_options',
    //     this.sH_Service.BTN_SL.WATCH
    //   );
    // }

    // await this.webhooksService.fePostToHold2('HAS',holdingObj['HAS'].price,'more_options',this.sH_Service.BTN_SL.HOLDING)
    // this.logger.warn('Running getholdingList with stocklist length:', symbols);
    // await this.postInteractiveText(this.sH_Service.BTN_SL.WATCH,DataSymbols.watchlist)
    // console.log(`✅ Loaded stock-related/holding: has ${this.sH_Service.HoldingList}`);
    // this.sH_Service.setSlackToken('SLACK_USER_TOKEN');

    // await this.postSLTest(Object.values(this.sH_Service.INTRA_30M_SL_))
    // await this.postSLTest([''])
    // await this.postSLTest([], 300)
    // // // await this.postDeleteBtn()
    // await this.postDeleteBtn()
    //  await this.dailyCleanup()
    //  console.log('done')
    // await this.webhooksService.deleteSLChannel(['C0BDW0MQ1D5'])

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
    // await this.CHECKBULL_BEAR_OTHER_5MIN(0,);
    // await this.CHECKBULL_5_15_30_1h(0)
    // this.webhooksService.deleteSLChannel(Object.values(this.sH_Service.Z_US_SL_))
    // this.sH_Service.bullbearDaily = this.sH_Service.bullbearUqiue
    // await this.CHECKBULL_BEAR_OTHER_5MIN(1,);
    // await this.CHECKBULL_5_15_30_1h(['SMCI'],0)
    // await this.webhooksService.deleteSLChannel(Object.values(this.sH_Service.INTRA_30M_SL_))
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
    if (!this.sH_Service.isMarketOpen()) {
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
              this.sH_Service.INTRA_30M_SL_.MACDCR_200,
              this.sH_Service.bullbearUqiue+textDetail,
            );
            const discodedata = await this.webhooksService.sendDiscord(
              `${textDetail}-${timeframe}-${lastData?.close}-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
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
          //     StochRSICross?this.sH_Service.INTRA_30M_SL_.MACDCR_50:this.sH_Service.INTRA_30M_SL_.MACDCR_100,
          //     this.sH_Service.bullbearUqiue+textDetail+' ',
          //   );
          //   this.aboveList.push(ticker)
          //   await this.webhooksService.sendDiscord(
          //     `${textDetail}-${timeframe}-${lastData?.close}-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
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
              this.sH_Service.INTRA_30M_SL_.WATCH,
              this.sH_Service.bullbearUqiue+'blMa200MACDPMA50cR',
            );
            await this.webhooksService.sendDiscord(
              `${'blMa200MACDPMA50cR'}-${timeframe}-${lastData?.close}-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
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
          //     this.sH_Service.INTRA_30M_SL_.WATCH,
          //     this.sH_Service.bullbearUqiue+'MA9crosMA20',
          //   );
          //   await this.webhooksService.sendDiscord(
          //     `${'MA9crosMA20'}-${timeframe}-${lastData?.close}-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
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
              this.sH_Service.INTRA_30M_SL_.MACDCR_BL,
              this.sH_Service.bullbearUqiue+'macdCrossAB',
            );
            await this.webhooksService.sendDiscord(
              `${'macdCrossAB'}-${timeframe}-${lastData?.close}-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
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
            `ERROR ${error.message} \n url: ${this.sH_Service.local4200}/price-log/${ticker}?daysRange=500`,
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
    if (!this.sH_Service.shouldRunTradingLogicUS(`${timeframe}min`,this.logger)) {
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
        Object.values(this.sH_Service.INTRA_30M_SL_).map((hook) =>
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
    const yesterday = this.sH_Service.getDateNDaysAgo(dayago);
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
  async CHECKBULL_BEAR_OTHER_5MIN(delay = 2) {
    await this.sH_Service.sendBatchNotification('START','checking',[this.sH_Service.Z_US_SL_.OR],this.webhooksService,100,);
    await this.CHECKBULL_BEAR_OTHER(delay);
  }

  // @Cron('*/15 9-16 * * 1-5', { timeZone: 'America/New_York' }) // other list at 15min
  async CHECKBULL_BEAR_OTHER_15MIN() {
    const forRundaily2 = await this.LocalPLWR.FireBaseApi('get',`stock-related/forRundaily-po5b/4hour.json`,'')
    const allkeys2 = Object.keys(forRundaily2)
    await this.CHECKBULL_BEAR_OTHER(3,allkeys2);
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
        try {
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
          await this.stratery_2Service.FristCheck(
            ticker,
            data_5min,
            ['5min','15min','30min','1hour'],
            this.LocalPLWR,
            this.webhooksService,
            [],
            []
          )
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
    this.sH_Service.ALL_IN_ONE = false
  }

  async postSLTest(webhooks =[ 'C0B77K2AG12','C0B6BFBKJ4X'],timewait = 1000) {
    // await this.sH_Service.sendBatchNotification('START','test',webhooks,this.webhooksService,timewait,);
    this.sH_Service.sendBatchNotification('START','test',Object.values(this.sH_Service.US_DAILY_),this.webhooksService,timewait,)
    this.sH_Service.sendBatchNotification('START','test',Object.values(this.sH_Service.US_4H_),this.webhooksService,timewait,)
    this.sH_Service.sendBatchNotification('START','test',Object.values(this.sH_Service.VN_SL_),this.webhooksService,timewait,)
    this.sH_Service.sendBatchNotification('START','test',Object.values(this.sH_Service.Z_US_SL_),this.webhooksService,timewait,)
    this.sH_Service.sendBatchNotification('START','test',Object.values(this.sH_Service.AI_SL),this.webhooksService,timewait,)
    this.sH_Service.sendBatchNotification('START','test',Object.values(this.sH_Service.INTRA_30M_SL_),this.webhooksService,timewait,)
    this.sH_Service.sendBatchNotification('START','test',Object.values(this.sH_Service.BULL_BEAR_SL_),this.webhooksService,timewait,)
  }

  async postInteractiveText(webhook, symbols) {
    await symbols.forEach(async symbol=>{
     await this.webhooksService.post2SlackBtnFn(webhook,symbol)
    })
  }
  async postDeleteBtn() {
    const channels = [
      ...Object.values(this.sH_Service.US_DAILY_), 
      ...Object.values(this.sH_Service.US_4H_), 
      ...Object.values(this.sH_Service.VN_SL_), 
      ...Object.values(this.sH_Service.Z_US_SL_), 
      ...Object.values(this.sH_Service.AI_SL), 
      ...Object.values(this.sH_Service.INTRA_30M_SL_), 
      ...Object.values(this.sH_Service.BULL_BEAR_SL_), 
      ...Object.values(this.sH_Service.BTN_SL)
    ];
    await channels.forEach(async channel=>{
        await this.webhooksService.fePostToHold2(
          'QQQ',
          null,
          'clear_each',
          channel
      );
    })
  }

  // @Cron('0 19 * * 1-5', { timeZone: 'America/New_York' }) // Every weekday at 7:00 PM New York time
  async dailyCleanup() {    
    // await this.webhooksService.deleteSLChannel(Object.values(this.sH_Service.US_DAILY_))
    // await this.webhooksService.deleteSLChannel(Object.values(this.sH_Service.US_4H_))
    // await this.webhooksService.deleteSLChannel(Object.values(this.sH_Service.VN_SL_))
    // await this.webhooksService.deleteSLChannel(Object.values(this.sH_Service.Z_US_SL_))
    // await this.webhooksService.deleteSLChannel(Object.values(this.sH_Service.AI_SL))
    // await this.webhooksService.deleteSLChannel(Object.values(this.sH_Service.BTN_SL))
    await this.webhooksService.deleteSLChannel(Object.values(this.sH_Service.INTRA_30M_SL_))
    await this.webhooksService.deleteSLChannel(Object.values(this.sH_Service.BTN_SL))
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
        try {
          const data_5min = await this.LocalPLWR.tiingo_US(ticker, '5min');
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
          await this.stratery_2Service.secondCheck(
            ticker,
            data_5min,
            '5min',
            this.webhooksService,
            [],
            []
          )
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