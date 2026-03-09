// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { VN_Stock_symbols } from './dto/chartData';
import * as Timer from './compareTime';
import pLimit from 'p-limit';
@Injectable()
export class TasksVNMKService {
  allkeys = 'all'; // test
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksVNMKService.name);

  private async processTickers(
    tickers: string[],
    B_Channel,
    HT_Channel,
  ) {
    const limit = pLimit(4); // Limit the concurrency to 8 at a time

    const date = new Date();
    // Delay 2 minutes before processing
    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {

        try {
          let data = await this.LocalPLWR.Eodhd_vn(ticker);

          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];

          // Process the data
          await this.webhooksService.BuyOnly_StochRSICrossAB200(
            data,
            lastData,
            secondLastData,
            ticker,
            '1day',
            B_Channel,
            HT_Channel,
          );
          this.logger.log(`${ticker} processed successfully.`);
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ON API AT: 1day On ${date}`,
            `RSIENDBOT ${ticker}.VN at 1day`,
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
   await this.runAllWatchLists();
    // console.log(  stock_500_symbols.length)
  }
  @Cron('*/15 14-21 * * 1-5', { timeZone: 'UTC' })
  async runAllWatchLists() {
    await Promise.all([
      this.processTickers(
        VN_Stock_symbols,
        'BUY_EARLY_DAY',
        'SELL_EARLY_DAY',
      ),
    ]);
  }
}
