// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';

@Injectable()
export class TasksForexService {
  constructor(
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
    private readonly webhooksService: WebhooksService,
  ) {}
  private readonly logger = new Logger(TasksForexService.name);
  tickers = ['EURUSD', 'GBPUSD'];
  private async processTickers1hour(
    tickers: string[],
    timeframe: string,
    apikey,
    buyChannel,
    sellChannel,
    delay = 5,
  ) {
    if (!this.stockHelperService.isForexMarketOpen()) {
      this.logger.log(`🕒 Forex market is CLOSED`);
      return;
    }
    this.logger.log(`✅ Forex market is OPEN`);
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));
    for (const ticker of tickers) {
      try {
        let data = await this.LocalPLWR.tiingo(ticker, timeframe, apikey);
        // const lastData = data[data.length - 1];
        // const secondLastData = data[data.length - 2];
        // console.log(lastData)
        await this.webhooksService.runCrOn_MA50(
          data,
          ticker,
          timeframe,
          buyChannel,
          sellChannel,
        );
        // await this.webhooksService.compareAndSend1hour(
        //   data.reverse(),
        //   lastData,
        //   secondLastData,
        //   ticker,
        //   timeframe,
        //   buyChannel,
        //   sellChannel,
        // );
        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        const date = new Date();
        this.webhooksService.sendDiscord(
          `ERROR ON TasksForexService: ${timeframe} On ${date}: ${JSON.stringify(
            error,
          )}`,
          `RSIENDBOT ${ticker} at ${timeframe}`,
          'Nono',
          'ERORR_CALL',
        );
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }
// @Cron('*/15 * * * *') // every 15 minutes
  async handle15minForex(time_wait = 3,tickers = this.tickers) {
    await this.processTickers1hour(
      tickers,
      '15min',
      '54c43c0fc7b27681254eeac1d7138d6b5477cf10',
      '15MIN_BUY_FX',
      '15MIN_SELL_FX',
      time_wait,
    );
  }
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handle30minForex(time_wait = 3,tickers = this.tickers) {
    await this.processTickers1hour(
      tickers,
      '30min',
      '5f7e0b2da2b5c849dfd5a3dc7938b82c02a7c6f4',
      '30MIN_BUY_FX',
      '30MIN_SELL_FX',
      time_wait,
    );
  }
  @Cron('0 * * * *') // every 1 hour
  async handle1hourForex(time_wait = 5,tickers = this.tickers) {
    await this.processTickers1hour(
      tickers,
      '1hour',
      '5f7e0b2da2b5c849dfd5a3dc7938b82c02a7c6f4',
      '1HOUR_BUY_FX',
      '1HOUR_SELL_FX',
      time_wait,
    );
  }
  @Cron(CronExpression.EVERY_4_HOURS)
  async handle4hourForex(time_wait = 5,tickers = this.tickers){
    await this.processTickers1hour(
      tickers,
      '4hour',
      '5f7e0b2da2b5c849dfd5a3dc7938b82c02a7c6f4',
      '4HOUR_BUY_FX',
      '4HOUR_SELL_FX',
      time_wait,
    );
  }

  async onModuleInit() {
    const date = new Date('2026-09-01T04:00:00.000Z');
 const datecoreect =   new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
}).formatToParts(date)
console.log(
  datecoreect
);
    await this.handle1hourForex(0,['EURUSD'])
    this.webhooksService.sendDiscord(
      `Run On deploy: **TasksForexService**`+datecoreect,
      `RSIENDBOT ON TasksForexService`,
      'Nono',
      'ERORR_CALL',
    );
  }
}
