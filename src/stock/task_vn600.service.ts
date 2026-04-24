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

  async onModuleInit() {
    // This runs ONCE when the app starts
   //  await this.runAllWatchLists();
    // console.log(  stock_500_symbols.length)
  }
  
  private async processTickers(tickers: string[], B_Channel, HT_Channel) {
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
          const symbol = `${ticker}.VN`;

          const signal = await this.stockHelperService.BuyOnly_StochRSICrossAB200(
            lastData,
            secondLastData,
          );

          if (!signal) return;
          const stockRSILAUP = lastData.StochRSI_K - lastData.StochRSI_D > 0;
          const macdCross = await this.stockHelperService.macdCross(
            lastData,
            secondLastData,
          );
          const webhookMap = [
            { condition: signal.PriceCrMA50 && signal.ContinueUp, hook: 'SLACK_WEBHOOKS_VN50' },
            { condition: signal.PriceCrMA100 && signal.ContinueUp, hook: 'SLACK_WEBHOOKS_VN100' },
            { condition: signal.PriceCrMA200 && signal.ContinueUp, hook: 'SLACK_WEBHOOKS_VN200' },
            { condition: stockRSILAUP && macdCross.AB, hook: 'SLACK_WEBHOOKS_VN_MACDCR' },
          ];

          const matched = webhookMap.find(({ condition }) => condition);

          if (matched) {
            await this.webhooksService.sendSlackNotificationVN(
              [symbol],
              lastData,
              matched.hook,
            );
          }
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


  @Cron('0 16 * * 1-5', { timeZone: 'America/New_York' })
  async runAllWatchLists() {
    const today = this.stockHelperService.getDateNDaysAgo(0);

    const webhooks = ['SLACK_WEBHOOKS_VN50', 'SLACK_WEBHOOKS_VN100','SLACK_WEBHOOKS_VN200','SLACK_WEBHOOKS_VN_MACDCR']
    const sendBatchNotification = async (type: 'START' | 'END') => {
      const message = `${type}*${today}${type}${'='.repeat(32)}`;
      await Promise.all(
        webhooks.map((hook) =>
          this.webhooksService.sendSlackNotification(message, hook),
        ),
      );
    };
    
    try {
      await sendBatchNotification('START');
    
      await this.processTickers(
        VN_Stock_symbols,
        'BUY_EARLY_DAY',
        'SELL_EARLY_DAY',
      );
    } catch (error) {
      console.error('VN processTickers failed:', error);
      throw error;
    } finally {
      await sendBatchNotification('END');
    }
  }
}
