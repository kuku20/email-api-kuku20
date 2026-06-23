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
    // await Object.values(this.stockHelperService.INTRA_30M_SL).forEach(async symbol=>{
    //   console.log(symbol)
    //   this.webhooksService.fePostToHold2('QQQ',null,'clear_each',symbol)
    // })
    //     await DataSymbols.watchlist.forEach(async symbol=>{
    //       await new Promise((resolve) => setTimeout(resolve, 500));
    //       await this.webhooksService.fePostToHold2(symbol,null,'more_options',this.stockHelperService.BTN_SL.WATCH)
    // })

    // await this.webhooksService.fePostToHold2('HAS',holdingObj['HAS'].price,'more_options',this.stockHelperService.BTN_SL.HOLDING)
    // this.logger.warn('Running getholdingList with stocklist length:', symbols);
    // await this.postInteractiveText(this.stockHelperService.BTN_SL.WATCH,DataSymbols.watchlist)
    // console.log(`✅ Loaded stock-related/holding: has ${this.stockHelperService.HoldingList}`);
    // this.stockHelperService.setSlackToken('SLACK_USER_TOKEN');

    // await this.postSLTest(['C0B748C0BCM'])
    // await this.postSLTest(['C0B748C0BCM'])

    
    //  await this.dailyCleanup()
    //  console.log('done')
    // await this.webhooksService.deleteSLChannel(['C0BANRCLEDV'])

    // await this.delete(-1)
    // await this.delete(0)
    // await this.bullBear('15',0);
    // await this.bullBear('30',0);
    // await this.CHECKBULL_BEAR('5min',0);
    // await this.CHECKBULL_BEAR('15min',0);
    // await this.CHECKBULL_BEAR('30min',0);
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
              this.stockHelperService.INTRA_30M_SL.US_30M_MACDCR_200,
              this.stockHelperService.bullbearUqiue+textDetail,
            );
            await this.webhooksService.sendDiscord(
              `${textDetail}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-${timeframe}-${textDetail}`,
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
          //     StochRSICross?this.stockHelperService.INTRA_30M_SL.US_30M_MACDCR_50:this.stockHelperService.INTRA_30M_SL.US_30M_MACDCR_100,
          //     this.stockHelperService.bullbearUqiue+textDetail+' ',
          //   );
          //   this.aboveList.push(ticker)
          //   await this.webhooksService.sendDiscord(
          //     `${textDetail}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
          //     `${ticker}-${timeframe}-${textDetail}`,
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
              this.stockHelperService.INTRA_30M_SL.US_30M_WATCH,
              this.stockHelperService.bullbearUqiue+'blMa200MACDPMA50cR',
            );
            await this.webhooksService.sendDiscord(
              `${'blMa200MACDPMA50cR'}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-${timeframe}-${'blMa200MACDPMA50cR'}`,
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
          //     this.stockHelperService.INTRA_30M_SL.US_30M_WATCH,
          //     this.stockHelperService.bullbearUqiue+'MA9crosMA20',
          //   );
          //   await this.webhooksService.sendDiscord(
          //     `${'MA9crosMA20'}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
          //     `${ticker}-${timeframe}-${'MA9crosMA20'}`,
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
              this.stockHelperService.INTRA_30M_SL.US_30M_MACDCR_BL,
              this.stockHelperService.bullbearUqiue+'macdCrossAB',
            );
            await this.webhooksService.sendDiscord(
              `${'macdCrossAB'}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-${timeframe}-${'macdCrossAB'}`,
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

  @Cron('*/15 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async bullBear_5MIN() {
    await this.bullBear('15',3);
  }

  @Cron('*/30 9-16 * * 1-5', { timeZone: 'America/New_York' })
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
        Object.values(this.stockHelperService.INTRA_30M_SL).map((hook) =>
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

  @Cron('0 19 * * 1-5', { timeZone: 'America/New_York' }) // Every weekday at 7:00 PM New York time
  async dailyCleanup() {    
    // await this.postSLTest()
    // this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.US_DAILY_))
    // this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.US_4H_))
    // this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.VN_SL))
    // this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.Z_US_SL))
    // this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.AI_SL))
    // this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.INTRA_30M_SL))
    // this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.BULL_BEAR_SL_))
  }

  async postSLTest(webhooks =[ 'C0B77K2AG12','C0B6BFBKJ4X']) {
    await this.stockHelperService.sendBatchNotification('START','test',webhooks,this.webhooksService,1000,);
  }

  @Cron('*/5 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async CHECKBULL_BEAR_5MIN() {
    await this.CHECKBULL_BEAR('5min',2);
  }

  @Cron('*/15 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async CHECKBULL_BEAR_15MIN() {
    await this.CHECKBULL_BEAR('15min',3);
  }

  @Cron('*/30 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async CHECKBULL_BEAR_30MIN() {
    await this.CHECKBULL_BEAR('30min',4);
  }

  async CHECKBULL_BEAR(timeframe = '15min',delay=2,symbols= ['QQQ','SPY']){
    if (!this.stockHelperService.shouldRunTradingLogicUS(timeframe,this.logger)) {
      return;
    }
    try {
      await this.CHECKBULL_BEAR_USTIMERUN(
        symbols,
        this.allkeys,
        'TSLA',
        'SMCI',
        delay,
        timeframe,
      );
    } catch (error) {
      console.error('timeframe failed:', error);
      throw error;
    } 
  }

  async  CHECKBULL_BEAR_USTIMERUN(
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
    // await this.webhooksService.SendDcChannels([B_Channel, HT_Channel,],this.logger,'START='+timeframe);
    const tickers = intickers;
    await this.CHECKBULL_BEAR_processTickers(
      tickers,
      timeframe,
      api,
      delay,
    );
    // await this.webhooksService.SendDcChannels([B_Channel, HT_Channel,],this.logger,'END='+timeframe);
  }

  private async CHECKBULL_BEAR_processTickers(
    tickers: string[],
    timeframe: string,
    apikey: string,
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
          const aboveOrBelowma50 = lastData.low > lastData.MA50
          const macdCrossAB = lastData.divergence > 0 && secondLastData.divergence < 0
          const macdCrossBL = lastData.divergence < 0 && secondLastData.divergence > 0
          const channel = ticker==='QQQ'? this.stockHelperService.BULL_BEAR_SL_.QQQ : this.stockHelperService.BULL_BEAR_SL_.SPY
          let text = ''
          const macdGreenOrRed = lastData.divergence > 0 ?'YYYYYY🟢🟢':'LLLLLLL🔴🔴'
          if(macdCrossAB){
            text = aboveOrBelowma50?'*macdCr_N🟢AB-GOODD🟢🟢🟢BUY_CALL_NOW🟢🟢🟢*':'*macdCr_N🔴BL50-🟢🟢🟢🟢🟢🔴*'
          }else if(macdCrossBL){
            text = aboveOrBelowma50?'*macdCrossNBL-🔴🔴🔴AB🔴🔴🔴*':'macdCrossNBL-SELLLLLLLL-DAY-🔴🔴🔴BUY_PUT_NOW🔴🔴🔴'
          }else if(aboveOrBelowma50){
            text = `*BUY🟢🟢AB🟢🟢${macdGreenOrRed}|(${lastData.divergence})*`
          }else{
            text = `*SELL🔴🔴BL🔴🔴${macdGreenOrRed}|(${lastData.divergence})*`
          }
          await this.webhooksService.sendSlackNotificationVN(
            timeframe,
            [ticker],
            lastData,
            channel,
            text,
          );
          const time = new Date().toLocaleString('en-US', {timeZone: 'America/New_York',});
          this.webhooksService.sendSlackNotification(`*${timeframe}*=${text +'=='+time}=`, channel),
          await this.webhooksService.sendDiscord(
            `${text}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
            `${ticker}-${timeframe}-${text}`,
            lastData,
            ticker==='QQQ'?'TSLA':'SMCI', 
            data,
          );
          await this.webhooksService.sendDiscord(
            `--------------------${text +'=='+time}---------------------------`,
            `RSIENDBOT ${ticker} at ${timeframe}`,
            'Nono',
            ticker==='QQQ'?'TSLA':'SMCI', 
          );
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

  async postInteractiveText(webhook, symbols) {
    await symbols.forEach(async symbol=>{
     await this.webhooksService.post2SlackBtnFn(webhook,symbol)
    })
  }
}