// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as StockSymbols from './dto/chartData';
import { stock_usall_symbols } from './dto/chartData';
import { stock_500_symbols } from './dto/chartData';
import { dayab50 } from './dto/chartData';
import pLimit from 'p-limit';
import { Cron, CronExpression } from '@nestjs/schedule';
@Injectable()
export class TestOndata_service {
  allkeys = 'all'; // test
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TestOndata_service.name);

  async onModuleInit() {
    // This runs ONCE when the app starts
    // await this.runfullonms();
    const SLACK_WEBHOOKS_US50 = await this.webhooksService.FireBaseApi('get',`stock-related/SLACK_WEBHOOKS_US50.json`,'')
    console.log('Data from Firebase:', SLACK_WEBHOOKS_US50);
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
    if (this.stockHelperService.isMarketOpen()) {
      this.logger.log(
        `🕒 Market closed — skipping ${timeframe} check (${now} ET)`,
      );
      return;
    }
    this.logger.log(
      `✅ Market open — running ${timeframe} trading logic (${now} ET)`,
    );
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
    const limit = pLimit(2); // Limit the concurrency to 8 at a time

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
            // data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
            data = await this.LocalPLWR.getTickerFullChart_POLYGON2(ticker, timeframe);
          } else {
            data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
          }

          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];

          // Process the data
          const signal =
          await this.stockHelperService.BuyOnly_StochRSICrossAB200(
            lastData,
            secondLastData,
          );
          if (!signal) return;
          
          const webhookMap = [
            { condition: signal.PriceCrMA50, hook: 'SLACK_WEBHOOKS_US50' },
            { condition: signal.PriceCrMA100, hook: 'SLACK_WEBHOOKS_US100' },
            { condition: signal.PriceCrMA200, hook: 'SLACK_WEBHOOKS_US200' },
          ];
          
          const matched = webhookMap.find((w) => w.condition);
          // const daytestBF = 5;
          // const dayend = this.stockHelperService.getDateNDaysAgo(-1 + daytestBF);
          if (matched) {
            const data1 = await this.webhooksService.FireBaseApi(
              'put',
              `stock-related/${matched.hook}/${ticker}.json`,
              lastData.close,
            );
            // await this.webhooksService.sendSlackNotificationVN(
            //   [ticker],
            //   lastData,
            //   matched.hook,
            // );
          }
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

  async runAllWatchLists30(symbols: string[] = stock_usall_symbols) {
    try {
  
      await this.USTIMERUN(
        symbols,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
        0,
        '30min',
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
    }
  }
}
