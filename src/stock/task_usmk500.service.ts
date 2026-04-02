// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { stock_500_symbols,stock_usall_symbols } from './dto/chartData';
import { dayab50 } from './dto/chartData';
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

  async USTIMERUN(
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
    await this.SendEverydayService([B_Channel, HT_Channel]);
    const tickers = intickers;
    await this.processTickers(
      tickers,
      timeframe,
      api,
      B_Channel,
      HT_Channel,
      delay,
    );
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
          } else {
            data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
          }

          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];

          // Process the data
          await this.webhooksService.BuyOnly_StochRSICrossAB200(
            data,
            lastData,
            secondLastData,
            ticker,
            timeframe,
            B_Channel,
            HT_Channel,
          );
          this.logger.log(`${ticker} processed successfully.`);
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ON API AT: ${timeframe} On ${date}`,
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

  async onModuleInit() {
    // This runs ONCE when the app starts
    //await this.runAllWatchLists();
    // console.log(  stock_500_symbols.length)
    this.stockHelperService.ListMA50On4hour = await this.LocalPLWR.getArrSymbolFFire('above-ma50/alldata/4hour') as string[];
    this.stockHelperService.ListMA50On1day = await this.LocalPLWR.getArrSymbolFFire('above-ma50/alldata/1day')as string[];
  }
    
  // @Cron('*/30 13-21 * * 1-5', { timeZone: 'UTC' }) // Every 30 minutes between 13:00 and 21:59 UTC (9:00 AM to 5:59 PM ET) on weekdays
  // @Cron('*/15 13-21 * * 1-5', { timeZone: 'UTC' }) // Every 15 minutes between 13:00 and 21:59 UTC (9:00 AM to 5:59 PM ET) on weekdays
  async runAllWatchLists() {
    await Promise.all([
      this.USTIMERUN(
        this.stockHelperService.ListMA50On4hour.length > 0
          ? this.stockHelperService.ListMA50On4hour
          : stock_500_symbols,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
        3,
        '15min',
      ),
    ]);
  }

  @Cron('*/30 13-21 * * 1-5', { timeZone: 'UTC' }) // Every 30 minutes between 13:00 and 21:59 UTC (9:00 AM to 5:59 PM ET) on weekdays
  async runAllWatchLists30() {
    await Promise.all([
      this.USTIMERUN(
        // this.stockHelperService.ListMA50On4hour.length > 0
        //   ? this.stockHelperService.ListMA50On4hour
        //   : stock_500_symbols,
        stock_usall_symbols,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
        5,
        '30min',
      ),
    ]);
  }

 // @Cron('10 13-21/4 * * 1-5', { timeZone: 'UTC' }) // Every 4 hours at 10 minutes past the hour between 13:00 and 21:00 UTC (9:10 AM to 5:10 PM ET) on weekdays
  async runAllWatchLists4h() {
    await Promise.all([
      this.USTIMERUN(
        this.stockHelperService.ListMA50On1day.length > 0
          ? this.stockHelperService.ListMA50On1day
          : stock_500_symbols,
        this.allkeys,
        'US_15M_HT',
        'US_15M_HT',
        0,
        '4h',
      ),
    ]);
  }

  //@Cron('6 9-15 * * 1-5', { timeZone: 'America/New_York' }) // Every day at 9:06 AM, 10:06 AM, ..., 3:06 PM ET on weekdays
  async runAllWatchLists1h() {
    await Promise.all([
      this.USTIMERUN(
        this.stockHelperService.ListMA50On1day.length > 0
          ? this.stockHelperService.ListMA50On1day
          : stock_500_symbols,
        this.allkeys,
        'US_30M_BUY',
        'US_30M_HT',
        0,
        '1h',
      ),
    ]);
  }
  async SendEverydayService(channels = ['US_ALL', 'USSTOCK_WATCH']) {
    const equal = `===========================================`;

    for (const channel of channels) {
      // CLOSE YESTERDAY
      await this.webhooksService.sendDiscordNotification(
        `${equal}==${equal}`,
        `${channel} RSIENDBOT`,
        JSON.stringify('lastdata'),
      );
      // Log completion
      this.logger.error(`✅ Finished sending for`, channel);
    }
  }
}
