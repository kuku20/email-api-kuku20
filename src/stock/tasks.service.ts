import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHelperService } from './stockHelper.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { LocalPLWR } from './runlocal.service';
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private readonly stockHelperService: StockHelperService,
    private readonly webhooksService: WebhooksService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  // Runs every 5 minutes
    // @Cron(CronExpression.EVERY_30_SECONDS)
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronCrypto() {
    this.logger.log('Running scheduled task for all tickers...');

    const tickers = ['BTC', 'BCH', 'LTC', 'ETH', 'DASH', 'ZEC', 'XMR'];
    // const tickers = ['BTC'];

    for (const ticker of tickers) {
      try {
        // 1️⃣ Get historical data for the ticker
        const data = await this.LocalPLWR.getCoinHistory(ticker, '5m');

        // 2️⃣ Process data with your helper
        const newData = await this.stockHelperService.returnNewData(data);

        // 3️⃣ Get the last two data points
        const lastData = newData[newData.length - 1];
        const secondLastData = newData[newData.length - 2];

        // 4️⃣ Compare and send alert if condition is met
        await this.compareAndSend(lastData, secondLastData, ticker);

        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        this.sendDiscord('BUY ERORR_CALL', ticker, {}, 'ERORR_CALL');
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }

  async compareAndSend(lastdata, Secondlastdata, ticker) {
    if (
      lastdata?.close < lastdata?.MA200 &&
      lastdata?.MA20 > lastdata?.MA50 &&
      Secondlastdata?.MA20 < Secondlastdata?.MA50
    ) {
      this.sendDiscord('BUY ERALLY', ticker, lastdata,'BUYSELL');
    }
    // else{
    //   this.sendDiscord('BUY ERALLY', ticker, {}, 'ERORR_CALL');
    //   this.sendDiscord('BUY ERALLY', ticker, lastdata,'BUYSELL');

    // }
    if (
      lastdata?.close > lastdata?.MA200 &&
      Secondlastdata?.close < Secondlastdata?.MA200
    ) {
      this.sendDiscord('bullish buy now check me', ticker, lastdata, 'BUYSELL');
    }
  }

  async sendDiscord(message:string, ticker:string, lastdata:any, channel:string) {
    try {
      return await this.webhooksService.sendDiscordNotification(
        message,
        `${channel} ${ticker}USD`,
        JSON.stringify(lastdata),
      );
    } catch (err) {
      console.error('❌ Error in controller:', err);
      throw err;
    }
  }
}
