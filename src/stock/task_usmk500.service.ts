// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
import * as Timer from './compareTime';
import pLimit from 'p-limit';
@Injectable()
export class TasksUSMKService_SP500 {
  allkeys = 'all'; // test
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksUSMKService_SP500.name);
  endpointFolder = 'stock-price-check';
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
    const today = new Date().toLocaleString('sv-SE', { timeZone: 'America/Chicago' }).replace(/[^\d]/g, '-');
    await this.webhooksService.SendDcChannels([B_Channel, HT_Channel,'US_30M_HT','WATCHLIST','US_30M_BUY','US_EARLY_15MIN'],this.logger,'START='+today);
    const tickers = intickers;
    await this.processTickers(
      tickers,
      timeframe,
      api,
      B_Channel,
      HT_Channel,
      delay,
    );
    await this.webhooksService.SendDcChannels([B_Channel, HT_Channel,'US_30M_HT','WATCHLIST','US_30M_BUY','US_EARLY_15MIN'],this.logger,'END='+today);
  }

  private async processTickers(
    tickers: string[],
    timeframe: string,
    apikey: string,
    B_Channel,
    HT_Channel,
    delay = 2,
  ) {
    const limit = pLimit(3); // Limit the concurrency to 8 at a time

    const date = new Date();

    const washselllists =
      (await this.LocalPLWR.loadWashSellList()) ||
      this.LocalPLWR.getWashSellList();
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));

    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {
        if (washselllists.includes(ticker)) {
          console.log(`⏭️ Skipping ${ticker} — in wash sell list`);
          return; // Skip this ticker and move on
        }

        try {
          let data;
          if (apikey === 'all') {
            data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
            // data = await this.LocalPLWR.getTickerFullChart_POLYGON2(ticker, timeframe);
          } else {
            data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
          }

          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];
          const isWithinRange = this.webhooksService.checktimeMinutesEST(
            ticker,
            lastData?.date,
            +this.runon15or30,
          );
          if (!isWithinRange) {
            return
          }
          if(this.stockHelperService.HoldingList.includes(ticker)){
            const BlMA200_MA20_MA50_MA100_SELL = await this.stockHelperService.BlMA200_MA20_MA50_MA100_SELL(
              lastData,
              secondLastData,
            );
            if(BlMA200_MA20_MA50_MA100_SELL){
              await this.webhooksService.sendSlackNotificationVN(timeframe,
                [ticker],
                lastData,
                'SLACK_WEBHOOKS_HOLDING','BlMA200_MA20_MA50_MA100_SELL',
                this.runon15or30
              );
              await this.webhooksService.sendDiscord(
                `SELLLLLL BlMA200_MA20_MA50_MA100_SELL-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
                `${ticker}-ON-${timeframe}`,
                lastData,
                'US_EARLY_5MIN',
                data,
              );
              return;
            }
          }
          // Process the data
          const signal = await this.webhooksService.BuyOnly_StochRSICrossAB200(
            data,
            lastData,
            secondLastData,
            ticker,
            timeframe,
            B_Channel,
            HT_Channel,
          );
          
          if (!signal) return;
          
          const webhookMap = [
            { condition: signal.PriceCrMA50 && signal.ContinueUp && lastData.divergence > 0, hook: 'SLACK_WEBHOOKS_US50' },
            { condition: signal.PriceCrMA100 && signal.ContinueUp && lastData.divergence > 0, hook: 'SLACK_WEBHOOKS_US100' },
            { condition: signal.PriceCrMA200 && signal.ContinueUp && lastData.divergence > 0, hook: 'SLACK_WEBHOOKS_US200' },
            { condition: signal.macdCrAB , hook: 'SLACK_WEBHOOKS_MACDCRAB' },
          ];
          
          const matched = webhookMap.find((w) => w.condition);
          const dateOut = lastData.date
          const timeput =dateOut.replace(/[: ]/g, '-');
          if (matched) {
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              DataSymbols.watchlist.includes(ticker)?'SLACK_WEBHOOKS_WATCHLIST':matched.hook,'',
              this.runon15or30
            );

            // const data1 = await this.webhooksService.FireBaseApi(
            //   'put',
            //   `${this.endpointFolder}/${matched.hook}/${timeput}/${timeframe}/${ticker}.json`,
            //   lastData.close,
            // );
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
  async getReapList(){
    await this.getholdingList()
    // need to clean this up
    this.stockHelperService.ListMA50On4hour = await this.LocalPLWR.getArrSymbolFFire(`${this.stockHelperService.aboveMA50api}/all3count/4hour`) as string[];
    this.stockHelperService.above50andBelow200 = await this.LocalPLWR.getArrSymbolFFire(`${this.stockHelperService.aboveMA50api}/alldata/4hour`)as string[];
    this.stockHelperService.above50andAbove200 = await this.LocalPLWR.getArrSymbolFFire(`${this.stockHelperService.aboveMA50api}-aboveMA200/alldata/4hour`)as string[];

    this.stockHelperService.ab50_bl200_3Candles = await this.LocalPLWR.getArrSymbolFFire(`${this.stockHelperService.aboveMA50api}/threeday/4hour`)as string[];
    this.stockHelperService.ab50_ab200_3Candles = await this.LocalPLWR.getArrSymbolFFire(`${this.stockHelperService.aboveMA50api}-aboveMA200/threeday/4hour`)as string[];
    this.stockHelperService.ab50_3Candles_ALL = this.stockHelperService.combineUnique( this.stockHelperService.ab50_bl200_3Candles,this.stockHelperService.ab50_ab200_3Candles);
    // console.table(this.stockHelperService.ab50_bl200_3Candles);
    // console.table(this.stockHelperService.above50andBelow200);
    // this.stockHelperService.ListMA50On1day = this.stockHelperService.combineUnique(this.stockHelperService.HoldingList,DataSymbols.watchlist,this.stockHelperService.above50andBelow200,this.stockHelperService.ab50_ab200_3Candles)
    this.stockHelperService.stockRSILAUP_4hourALL  =await this.LocalPLWR.getArrSymbolFFire(`macdCross_AB/All/4hour`,'stockRSILAUP')
    this.stockHelperService.stockRSILAUP_1dayALL  =await this.LocalPLWR.getArrSymbolFFire(`macdCross_AB/All/1day`,'stockRSILAUP')
    // const combinedRSILAUP = this.stockHelperService.combineUnique(this.stockHelperService.stockRSILAUP_4hourALL, this.stockHelperService.stockRSILAUP_1dayALL);
    const combinedRSILAUP = this.stockHelperService.combineUnique(this.stockHelperService.stockRSILAUP_4hourALL);
    // console.log('combinedRSILAUP',combinedRSILAUP);
    // const holdingObj = await this.LocalPLWR.FireBaseApi('get',`stockRSILAUP/macdCross_AB/DyDay/2hour.json`,'')
    // const macdCross_AB = this.stockHelperService.getKeysFromLastN(holdingObj,1)

   const holdingObj = await this.LocalPLWR.FireBaseApi('get',`stockRSILAUP/macdCross_AB/upYet/1day.json`,'')
   const macdCross_AB = Object.keys(holdingObj);
   console.log(`✅ Loaded stockRSILAUP/macdCross_AB/DyDay/2hour: has ${macdCross_AB.length} symbols`);
    // this is all run
    this.stockHelperService.ListMA50On1day = this.stockHelperService.combineUnique(this.stockHelperService.HoldingList,DataSymbols.watchlist,macdCross_AB)
    console.log( this.stockHelperService.ListMA50On1day.length,);
  }
  async onModuleInit() {
    // await this.getReapList()
    // this.runAllWatchLists30()
    // this.runAllWatchLists30(DataSymbols.watchlist)
    // this.runAllWatchLists30(this.stockHelperService.ListMA50On4hour)
    // console.table(this.stockHelperService.ab50_bl200_3Candles)
    // this.justSend(
    //   this.stockHelperService.ab50_bl200_3Candles,
    //   '4hour',
    //    'all',
    //   //
    // )
    // this.runAllWatchLists30()
  }
  async getholdingList() {
    const holdingObj = await this.LocalPLWR.FireBaseApi('get',`stock-related/holding.json`,'')
    this.stockHelperService.HoldingList = Object.keys(holdingObj);
    console.log(`✅ Loaded stock-related/holding: has ${this.stockHelperService.HoldingList.length} symbols`);
    return this.stockHelperService.HoldingList;
  }

  // @Cron('*/30 13-21 * * 1-5', { timeZone: 'UTC' }) // Every 30 minutes between 13:00 and 21:59 UTC (9:00 AM to 5:59 PM ET) on weekdays
  // @Cron('*/15 13-21 * * 1-5', { timeZone: 'UTC' }) // Every 15 minutes between 13:00 and 21:59 UTC (9:00 AM to 5:59 PM ET) on weekdays
  async runAllWatchLists() {
    await Promise.all([
      this.USTIMERUN(
        this.stockHelperService.ListMA50On4hour.length > 0
          ? this.stockHelperService.ListMA50On4hour
          : DataSymbols.stock_500_symbols,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
        3,
        '15min',
      ),
    ]);
  }

  // @Cron('5,35 13-21 * * 1-5', { timeZone: 'UTC' }) // Every 30 minutes at 5 and 35 minutes past the hour between 13:00 and 21:59 UTC (9:00 AM to 5:59 PM ET) on weekdays

  runon15or30 :'30'|'15'= '15';
  @Cron('*/15 13-21 * * 1-5', { timeZone: 'UTC' }) // Every 15 minutes between 13:00 and 21:59 UTC (9:00 AM to 5:59 PM ET) on weekdays
  // runon15or30 :'30'|'15'= '30';
  // @Cron('*/30 13-21 * * 1-5', { timeZone: 'UTC' }) // Every 30 minutes between 13:00 and 21:59 UTC (9:00 AM to 5:59 PM ET) on weekdays
  async runAllWatchLists30() {
    if (!this.stockHelperService.shouldRunTradingLogicUS(`${this.runon15or30}min`,this.logger)) {
      return;
    }
    await this.getReapList()
    if(this.stockHelperService.ListMA50On1day.length === 0){
      this.logger.warn('No stocks to process for 15/30-minute run.');
      return;
    }
    const today = new Date().toLocaleString('sv-SE', { timeZone: 'America/Chicago' }).replace(/[^\d]/g, '-');
    // const today = this.stockHelperService.getDateNDaysAgo(0);
    const webhooks = ['SLACK_WEBHOOKS_US50', 'SLACK_WEBHOOKS_US100','SLACK_WEBHOOKS_US200','SLACK_WEBHOOKS_MACDCRAB','SLACK_WEBHOOKS_WATCHLIST','SLACK_WEBHOOKS_HOLDING'];
  
    const sendBatchNotification = async (type: 'START' | 'END') => {
      const message = `${type}*${today}*${type}${'='.repeat(32)}`;
      await Promise.all(
        webhooks.map((hook) =>
          this.webhooksService.sendSlackNotification(message, hook),
        ),
      );
    };
  
    try {
      await sendBatchNotification('START');
  
      await this.USTIMERUN(
        this.stockHelperService.ListMA50On1day,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
        this.runon15or30 === '30'? 5 : 3,
        `${this.runon15or30}min`,
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
      await sendBatchNotification('END');
    }
  }

 // @Cron('10 13-21/4 * * 1-5', { timeZone: 'UTC' }) // Every 4 hours at 10 minutes past the hour between 13:00 and 21:00 UTC (9:10 AM to 5:10 PM ET) on weekdays
  // async runAllWatchLists4h() {
  //   // runOn4hourInday
  //   const runonday = await this.LocalPLWR.getArrSymbolFFire(`runOn4hourInday/4hour`)as string[];

  //   await Promise.all([
  //     this.USTIMERUN(
  //       runonday,
  //       this.allkeys,
  //       'US_15M_HT',
  //       'US_15M_HT',
  //       0,
  //       '4h',
  //     ),
  //   ]);
  // }

  //@Cron('6 9-15 * * 1-5', { timeZone: 'America/New_York' }) // Every day at 9:06 AM, 10:06 AM, ..., 3:06 PM ET on weekdays
  async runAllWatchLists1h() {
    await Promise.all([
      this.USTIMERUN(
        this.stockHelperService.ListMA50On1day.length > 0
          ? this.stockHelperService.ListMA50On1day
          : DataSymbols.stock_500_symbols,
        this.allkeys,
        'US_30M_BUY',
        'US_30M_HT',
        0,
        '1h',
      ),
    ]);
  }



  private async justSend(
    tickers: string[],
    timeframe: string,
    apikey: string,
    delay = 0,
  ) {
    const limit = pLimit(3); // Limit the concurrency to 8 at a time

    const date = new Date();

    const washselllists =
      (await this.LocalPLWR.loadWashSellList()) ||
      this.LocalPLWR.getWashSellList();
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));
    const message = `${'='.repeat(32)}`;
    this.webhooksService.sendSlackNotification(message, 'SLACK_WEBHOOKS_4h');
    await this.webhooksService.SendDcChannels(['TSLA'],this.logger,'START');
    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {
        if (washselllists.includes(ticker)) {
          console.log(`⏭️ Skipping ${ticker} — in wash sell list`);
          return; // Skip this ticker and move on
        }

        try {
          let data;
          if (apikey === 'all') {
            data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
            // data = await this.LocalPLWR.getTickerFullChart_POLYGON2(ticker, timeframe);
          } else {
            data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
          }

          const lastData = data[data.length - 1];
         
          if (true) {
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              'SLACK_WEBHOOKS_4h','',
              this.runon15or30
            );
            await this.webhooksService.sendDiscord(
              `BUY BUYBUY-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}`,
              lastData,
              'TSLA',
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

    this.webhooksService.sendSlackNotification(message, 'SLACK_WEBHOOKS_4h');
    await this.webhooksService.SendDcChannels(['TSLA'],this.logger,'END');
  }
}
