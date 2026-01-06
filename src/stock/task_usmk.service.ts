// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as Timer from './compareTime';
@Injectable()
export class TasksUSMKService {
  allkeys = 'all'; // test
  mysymbols = [
    'INTC',
    'SMCI',
    'BULL',
    'RDW',
    'CRWV',
    'TSLA',
    'BILL',
    'QQQ',
    'SPY',
    'SNAP',
    'BULL',
    'UNH',
    'TTD',
    'CNC',
  ]; // test symbols
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksUSMKService.name);

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
    const date = new Date();

    const washselllists =
      (await this.LocalPLWR.loadWashSellList()) ||
      this.LocalPLWR.getWashSellList();
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));

    for (const ticker of tickers) {
      if (washselllists.includes(ticker)) {
        console.log(`⏭️ Skipping ${ticker} — in wash sell list`);
        continue; // ✅ Skip this ticker and move on
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

        await this.webhooksService.compareAndSend1hour(
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
        this.webhooksService.sendDiscord(
          `ERROR ON API AT: ${timeframe} On ${date}`,
          `RWBOT ${ticker} at ${timeframe}`,
          'Nono',
          'ERORR_CALL',
        );
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }

  @Cron('*/5 14-21 * * 1-5', { timeZone: 'UTC' })
  async runAllWatchLists() {
    const symbols = (await this.LocalPLWR.getDolist()) || [];
    const combined = [...this.mysymbols, ...symbols];
    await Promise.all([
      this.USTIMERUN(
        combined,
        this.allkeys,
        'US_EARLY_5MIN',
        'US_5M_HT',
        2,
        '5min',
      ),
    ]);
  }

  @Cron('*/15 14-21 * * 1-5', { timeZone: 'UTC' })
  async runAllWatL15min() {
    const symbols = (await this.LocalPLWR.getDolist()) || [];
    const combined = [...this.mysymbols, ...symbols];
    await Promise.all([
      this.USTIMERUN(
        combined,
        this.allkeys,
        'US_EARLY_15MIN',
        'US_15M_HT',
        3,
        '15min',
      ),
    ]);
  }
}
