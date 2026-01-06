// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';

@Injectable()
export class TasksUSMK_1MIN_Service {
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
  private readonly logger = new Logger(TasksUSMK_1MIN_Service.name);

  async USTIMERUN(
    intickers: string[],
    api: any,
    channel,
    delay,
    timeframe = '1min',
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
    await this.processTickers(tickers, timeframe, api, channel, delay);
  }

  private async processTickers(
    tickers: string[],
    timeframe: string,
    apikey: string,
    channel: string,
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

        await this.compareAndSend(data,
          lastData,
          secondLastData,
          ticker,
          timeframe,
          ticker,
        );
        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        this.sendDiscord(
          `ERROR ON API AT: ${timeframe} On ${date}`,
          `RSIENDBOT ${ticker} at ${timeframe}`,
          'Nono',
          'ERORR_CALL',
        );
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }
  async compareAndSend(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    channel,
  ) {
    const isWithinRange = this.webhooksService.checktimeMinutesEST(ticker,lastdata?.date,2);
    if (!isWithinRange) {
      return;
    }
    const AbMA200BUY_MACDCR = await this.stockHelperService.AbMA200BUY_MACDCR(
      lastdata,
      Secondlastdata,
    );
    if (AbMA200BUY_MACDCR) {
      await this.sendDiscord(
        `BUY AbMA200BUY_MACDCR-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        channel,
        data,
      );
      return;
    }

    const Over200NUpBuy = await this.stockHelperService.Over200NUpBuy(
      lastdata,
      Secondlastdata,
    );
    if (Over200NUpBuy) {
      await this.sendDiscord(
        `BUY Over200NUpBuy-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        channel,
        data,
      );
      return;
    }

    const macdCrossAB_BL0 = await this.stockHelperService.macdCrossAB_BL0(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossAB_BL0) {
      await this.sendDiscord(
        `BUY macdCrossAB_BL0-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        channel,
        data,
      );
      return;
    }
    const priceAbMA200BUY = await this.stockHelperService.priceAbMA200BUY(
      lastdata,
      Secondlastdata,
    );
    if (priceAbMA200BUY) {
      await this.sendDiscord(
        `BUY priceAbMA200BUY-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        channel,
        data,
      );
      return;
    }
    const priceBlMA200SELL = await this.stockHelperService.priceBlMA200SELL(
      lastdata,
      Secondlastdata,
    );
    if (priceBlMA200SELL) {
      await this.sendDiscord(
        `SELLUSLLLL priceBlMA200SELL-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        channel,
        data,
      );
      return;
    }

    const Under200NDownSell = await this.stockHelperService.Under200NDownSell(
      lastdata,
      Secondlastdata,
    );
    if (Under200NDownSell) {
      await this.sendDiscord(
        `SELLUSLLLL Under200NDownSell-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        channel,
        data,
      );
      return;
    }

  }
  async sendDiscord(
    message: string,
    ticker: string,
    lastdata: any,
    channel: string,
    data?: any,
  ) {
    try {
      const fileBuffer = await this.webhooksService.captureChart(
        data,
        ticker,
        channel,
        message,
      );
      return await this.webhooksService.sendDiscordNotification(
        message,
        `${channel} ${ticker}`,
        JSON.stringify(lastdata),
        fileBuffer,
      );
    } catch (err) {
      console.error('❌ Error in controller:', err);
      throw err;
    }
  }
  // @Cron('10 14-21 * * 1-5', { timeZone: 'UTC' })
  @Cron('10 * * * * *', { timeZone: 'UTC' }) // every minute at the 10th second in UTC for testing
  async runAllWatchLists() {
    await Promise.all([
      this.USTIMERUN(this.mysymbols, this.allkeys, 'US_EARLY_5MIN', 0, '1min'),
    ]);
  }
}
