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
export class TasksUS_ALL_MK_MASS_Service {
  allkeys = 'all'; // test
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksUS_ALL_MK_MASS_Service.name);

  async USTIMERUN(
    intickers: string[],
    B_Channel,
    HT_Channel,
    delay,
    timeframe = '5min',
  ) {
    const tickers = intickers;
    await this.processTickers(tickers, timeframe, B_Channel, HT_Channel, delay);
  }

  private async processTickers(
    tickers: string[],
    timeframe: string,
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
          let data = await this.LocalPLWR.getTickerFullChart_POLYGON2(
            ticker,
            timeframe,
          );
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
// await this.runfullonms();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'America/Los_Angeles',
  })
  async runfullonms() {
    this.stockHelperService.ListMA50On1day = []; // Clear the list at the start of each run
    await this.SendEverydayService('EARLY_AB200', '200AB_LESS_01', '1day');
    await this.send1chanel('200AB_LESS_05', '1day');
    await this.webhooksService.sendSlackNotification('', '1day');
    await this.runAllWatchLists();
    await this.SendEverydayService('EARLY_AB200', '200AB_LESS_01', '1day');
    await this.send1chanel('200AB_LESS_05', '1day');


    this.stockHelperService.ListMA50On4hour = [];
    await this.SendEverydayService(
      '200BL_OV_NEG_01',
      '200BL_OV_NEG_05',
      '4hour',
    );
    await this.send1chanel( '200AB_LESS_1', '4hour');
    await this.webhooksService.sendSlackNotification('', '4hour');
    await this.runAllOn1h(this.stockHelperService.ListMA50On1day);
    await this.SendEverydayService(
      '200BL_OV_NEG_01',
      '200BL_OV_NEG_05',
      '4hour',
    );
    await this.send1chanel( '200AB_LESS_1', '4hour');
  }

  async runAllWatchLists() {
    await Promise.all([
      this.USTIMERUN(
        StockSymbols.stock_usall_symbols,
        'EARLY_AB200',
        '200AB_LESS_01',
        0,
        '1day',
      ),
    ]);
    await this.webhooksService.sendlast('EARLY_AB200', '200AB_LESS_01');
  }

  async runAllOn1h(stocklist = StockSymbols.stock_500_symbols) {
    await Promise.all([
      this.USTIMERUN(
        stocklist,
        '200BL_OV_NEG_01',
        '200BL_OV_NEG_05',
        0,
        '4hour',
      ),
    ]);
    await this.webhooksService.sendlast('200BL_OV_NEG_01', '200BL_OV_NEG_05');
  }

  async SendEverydayService(chanel1, chanel2, timeframe = '1day') {
    const equal = `===========================================`;
    const Channels = [chanel1, chanel2]; // example list

    for (const channel of Channels) {
      // CLOSE YESTERDAY
      await this.webhooksService.sendDiscordNotification(
        `${equal}=${timeframe}=${equal}`,
        `${channel} RSIENDBOT`,
        JSON.stringify('lastdata'),
      );
      // Log completion
      this.logger.error(`✅ Finished sending for`, channel);
    }
  }

  async send1chanel(channel, timeframe = '1day') {
    const equal = `===========================================`;
    await this.webhooksService.sendDiscordNotification(
      `${equal}=${timeframe}=${equal}`,
      `${channel} RSIENDBOT`,
      JSON.stringify('lastdata'),
    );
    // Log completion
    this.logger.error(`✅ Finished sending for`, channel);
  }
}
