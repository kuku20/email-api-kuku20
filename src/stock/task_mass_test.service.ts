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
  daytestBF = 30;
  dayend = this.stockHelperService.getDateNDaysAgo(-1 + this.daytestBF);
  endpointFolder = 'stock-price-check';
  timeframe = '30min';
  async onModuleInit() {
    // This runs ONCE when the app starts
    // const symbols =  await this.LocalPLWR.getArrSymbolFFire('above-ma50/alldata/4hour') as string[];
    // await this.runAllWatchLists30(symbols);
    const endpon = '2026-04-06-12-00-00'
    // await this.runAllWatchLists30();
    const path = `${this.endpointFolder}/SLACK_WEBHOOKS_US50/${endpon}/${this.timeframe}.json`;
    const SLACK_WEBHOOKS_US50 = await this.webhooksService.FireBaseApi(
      'get',
      path,
      '',
    );
    console.log('SLACK_WEBHOOKS_US50:', SLACK_WEBHOOKS_US50);
    const SLACK_WEBHOOKS_US100 = await this.webhooksService.FireBaseApi(
      'get',
      path.replace('SLACK_WEBHOOKS_US50', 'SLACK_WEBHOOKS_US100'),
      '',
    );
    const SLACK_WEBHOOKS_US200 = await this.webhooksService.FireBaseApi(
      'get',
      path.replace('SLACK_WEBHOOKS_US50', 'SLACK_WEBHOOKS_US200'),
      '',
    );
    this.comparePrice(0, SLACK_WEBHOOKS_US50);
    // this.comparePrice(5, SLACK_WEBHOOKS_US100);
    // this.comparePrice(30, SLACK_WEBHOOKS_US200);
  }

  async USTIMERUN(
    intickers: string[],
    api: any,
    B_Channel,
    HT_Channel,
    delay,
    timeframe = '5min',
  ) {
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
            data = await this.LocalPLWR.getTickerFullChart_POLYGON2(
              ticker,
              timeframe,
              this.daytestBF,
            );
          } else {
            data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
          }

          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];
          console.log(`Data for ${ticker}:`, lastData.date);
          // Process the data
          const signal =
            await this.stockHelperService.BuyOnly_StochRSICrossAB200(
              lastData,
              secondLastData,
            );
          if (!signal) return;

          const webhookMap = [
            { condition: signal.PriceCrMA50 && signal.ContinueUp, hook: 'SLACK_WEBHOOKS_US50' },
            { condition: signal.PriceCrMA100 && signal.ContinueUp, hook: 'SLACK_WEBHOOKS_US100' },
            { condition: signal.PriceCrMA200 && signal.ContinueUp, hook: 'SLACK_WEBHOOKS_US200' },
          ];

          const matched = webhookMap.find((w) => w.condition);
          const dateOut = lastData.date
          const timeput =dateOut.replace(/[: ]/g, '-');
          if (matched) {
            const data1 = await this.webhooksService.FireBaseApi(
              'put',
              `${this.endpointFolder}/${matched.hook}/${timeput}/${timeframe}/${ticker}.json`,
              lastData.close,
            );
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
        `${this.timeframe}`,
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
    }
  }

  async comparePrice(dayin, symbolsNprice: { [key: string]: number }) {
    try {
      await this.comparePriceRun(
        dayin,
        symbolsNprice,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
        0,
        `${this.timeframe}`,
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
    }
  }
  async comparePriceRun(
    dayin,
    symbolsNprice: any,
    apikey: any,
    B_Channel,
    HT_Channel,
    delay,
    timeframe = '5min',
  ) {
    const tickers = Object.keys(symbolsNprice);
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
            data = await this.LocalPLWR.getTickerFullChart_POLYGON2(
              ticker,
              timeframe,
              dayin,
            );
          } else {
            data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
          }

          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];
          const setDateValue = symbolsNprice[ticker];
          const lastestPrice = lastData.close;
          console.log(`Data for ${ticker}:`, lastData.date);
          // Process the data
          // const signal =
          // await this.stockHelperService.BuyOnly_StochRSICrossAB200(
          //   lastData,
          //   secondLastData,
          // );
          // if (!signal) return;

          // const webhookMap = [
          //   { condition: signal.PriceCrMA50, hook: 'SLACK_WEBHOOKS_US50' },
          //   { condition: signal.PriceCrMA100, hook: 'SLACK_WEBHOOKS_US100' },
          //   { condition: signal.PriceCrMA200, hook: 'SLACK_WEBHOOKS_US200' },
          // ];

          // const matched = webhookMap.find((w) => w.condition);
          // const daytestBF = 5;
          // const dayend = this.stockHelperService.getDateNDaysAgo(-1 + daytestBF);
          // if (matched) {
          //   const data1 = await this.webhooksService.FireBaseApi(
          //     'put',
          //     `${this.endpointFolder}/${matched.hook}/${dayend}/${ticker}.json`,
          //     lastData.close,
          //   );
          // }
          if (lastestPrice > setDateValue) {
            this.logger.log(
              `${ticker} ${stock_500_symbols.includes(ticker)?'(Sp500)':''} go Up: ${
                lastestPrice > setDateValue
              } | lastestPrice: ${lastestPrice} | Set Price: ${setDateValue}`,
            );
          } else {
            this.logger.error(
              `${ticker} ${stock_500_symbols.includes(ticker)?'(Sp500)':''}  go Down: ${
                lastestPrice > setDateValue
              } | lastestPrice: ${lastestPrice} | Set Price: ${setDateValue}`,
            );
          }
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
}
