// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import pLimit from 'p-limit';
@Injectable()
export class TaskHoldingService {
  allkeys = 'all'; // test
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TaskHoldingService.name);
  async onModuleInit() {
    // This runs ONCE when the app starts
    // this.runAllWatchLists30()
    // this.runDaily()
  }
  private async processTickers(
    dataForm: string = 'MASS',
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
            if(dataForm === 'twelvedata'){
              data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
            } else {
              data = await this.LocalPLWR.getTickerFullChart_POLYGON2(ticker, timeframe);
            }
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
          if (!isWithinRange && timeframe !== '1day') {
            return
          }
          // Process the data
          const BlMA200_MA20_MA50_MA100_SELL = await this.stockHelperService.BlMA200_MA20_MA50_MA100_SELL(
            lastData,
            secondLastData,
          );
          if(BlMA200_MA20_MA50_MA100_SELL){
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              this.stockHelperService.Z_US_SL.Z_US_SL_HOLDING,'BlMA200_MA20_MA50_MA100_SELL',
              this.runon15or30
            );
            await this.webhooksService.sendDiscord(
              `SELLLLLL BlMA200_MA20_MA50_MA100_SELL-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}`,
              lastData,
              HT_Channel,
              data,
            );
            return;
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

    await Promise.all(tickerPromises);
  }

  runon15or30 :'30'|'15'= '15';
  // @Cron('*/15 13-21 * * 1-5', { timeZone: 'UTC' }) // Every 15 minutes between 13:00 and 21:59 UTC (9:00 AM to 5:59 PM ET) on weekdays
  // runon15or30 :'30'|'15'= '30';
  // @Cron('*/30 13-21 * * 1-5', { timeZone: 'UTC' }) // Every 30 minutes between 13:00 and 21:59 UTC (9:00 AM to 5:59 PM ET) on weekdays
  async runAllWatchLists30() {
    const symbols = await this.LocalPLWR.getholdingList_W_other()
    this.logger.warn('Running getholdingList with stocklist length:', symbols.length);

    const webhooks = [this.stockHelperService.Z_US_SL.Z_US_SL_HOLDING];
  
    try {
      await this.stockHelperService.sendBatchNotification('START',`${this.runon15or30}min`,webhooks,this.webhooksService,1000,);
  
      await this.USTIMERUN('twelvedata',
        symbols,
        this.allkeys,
        'US_EARLY_5MIN',
        'US_5M_HT',
        this.runon15or30 === '30'? 5 : 3,
        `${this.runon15or30}min`,
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
      await this.stockHelperService.sendBatchNotification('END',`${this.runon15or30}min`,webhooks,this.webhooksService,1000,);
    }
  }

  @Cron('0 3 * * 1-5', {
    timeZone: 'America/Chicago',
  })
  async runDaily() {
    const symbols = await this.LocalPLWR.getholdingList_W_other()
    // await this.webhooksService.sendSlackNotificationVN(timeframe,
    //   symbols,
    //   null,
    //   this.stockHelperService.Z_US_SL.Z_US_SL_HOLDING,'',
    //   '500'
    // );
    const webhooks = [this.stockHelperService.Z_US_SL.Z_US_SL_HOLDING];
  
    try {

      await this.stockHelperService.sendBatchNotification('START','1day',webhooks,this.webhooksService,1000,);
  
      await this.USTIMERUN('MASS',
        symbols,
        this.allkeys,
        'US_EARLY_5MIN',
        'US_5M_HT',
        0,
        `1day`,
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
      await this.stockHelperService.sendBatchNotification('END','1day',webhooks,this.webhooksService,1000,);
    }
  }

  async  USTIMERUN(
    dataForm: string,
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
    await this.webhooksService.SendDcChannels([B_Channel, HT_Channel],this.logger,'START='+today);
    const tickers = intickers;
    await this.processTickers(dataForm,
      tickers,
      timeframe,
      api,
      B_Channel,
      HT_Channel,
      delay,
    );
    await this.webhooksService.SendDcChannels([B_Channel, HT_Channel],this.logger,'END='+today);
  }

}
