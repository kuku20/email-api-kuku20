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
@Injectable()
export class TasksUS_ALL_MKService {
  allkeys = 'all'; // test
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksUS_ALL_MKService.name);

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
    const limit = pLimit(1); // Limit the concurrency to 1 at a time

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
          // Process the data
          await this.webhooksService.runALLOn_MA50(
            data,
            ticker,
            timeframe,
            B_Channel,
            HT_Channel,
          );
          this.logger.log(`${ticker} processed successfully.`);
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ON API AT: ${timeframe} On ${date}| ${ticker}`,
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
    // await this.runAllOn1h();
    // await this.runAllWatchLists();
    // console.log(  stock_500_symbols.length)
  }
  // @Cron('*/15 14-21 * * 1-5', { timeZone: 'UTC' }) // Every 15 minutes between 14:00 and 21:59 UTC (10:00 AM to 5:59 PM ET) on weekdays
  //@Cron('*/30 14-21 * * 1-5', { timeZone: 'UTC' }) // Every 30 minutes between 14:00 and 21:59 UTC (10:00 AM to 5:59 PM ET) on weekdays
  async runAllWatchLists() {
    await Promise.all([
      this.USTIMERUN(
        StockSymbols.stock_usall_symbols,
        this.allkeys,
        'EARLY_AB200',
        '200AB_LESS_01',
        0,
        '1day',
      ),
    ]);
    await this.webhooksService.sendlast('EARLY_AB200', '200AB_LESS_01');
  }

  async runAllOn1h() {
    await Promise.all([
      this.USTIMERUN(
        StockSymbols.dayab50,
        this.allkeys,
        '200BL_OV_NEG_01',
        '200BL_OV_NEG_05',
        0,
        '1h',
      ),
    ]);
    await this.webhooksService.sendlast('200BL_OV_NEG_01', '200BL_OV_NEG_05');
  }
}
