// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as StockSymbols from './dto/chartData';
import { stock_usall_symbols, watchlist } from './dto/chartData';
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

  async onModuleInit() {
    // This runs ONCE when the app starts
    // await this.runfullonms();
    // await this.getMarket(stock_usall_symbols)
    // await this.writeAbove2BillionToFile();
  }

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
          if (timeframe === '1day') {
            const lastData = data[data.length - 1];
            const secondLastData = data[data.length - 2];
            const signal =
              await this.stockHelperService.BuyOnly_StochRSICrossAB200(
                lastData,
                secondLastData,
              );
            const MACDPositive = lastData.divergence > 0;
            if(signal && signal.RSI15up){
              await this.webhooksService.sendDiscord(
                `${
                  stock_500_symbols.includes(ticker) ? '(SP500)-' : ''
                }SBUY-RSI15AL-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
                `${ticker}-ON-${timeframe}`,
                lastData,
                'RSI15AL',
                data,
              );
            }else if(signal && signal.RSI20up){
              await this.webhooksService.sendDiscord(
                `${
                  stock_500_symbols.includes(ticker) ? '(SP500)-' : ''
                }SBUY-RSI20AL-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
                `${ticker}-ON-${timeframe}`,
                lastData,
                'RSIALERT',
                data,
              );
            }else if(signal && signal.RSI25up){
              await this.webhooksService.sendDiscord(
                `${
                  stock_500_symbols.includes(ticker) ? '(SP500)-' : ''
                }SBUY-RSI25AL-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
                `${ticker}-ON-${timeframe}`,
                lastData,
                'RSI25AL',
                data,
              );
            }else if(signal && signal.RSI30up){
              await this.webhooksService.sendDiscord(
                `${
                  stock_500_symbols.includes(ticker) ? '(SP500)-' : ''
                }SBUY-RSI30AL-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
                `${ticker}-ON-${timeframe}`,
                lastData,
                'RSI30AL',
                data,
              );
            };
            if (!signal) return;

            const webhookMap = [
              {
                condition: signal.PriceCrMA50 && MACDPositive,
                hook: 'SLACK_WEBHOOKS_D_US50',
              },
              {
                condition: signal.PriceCrMA100 && MACDPositive,
                hook: 'SLACK_WEBHOOKS_D_US100',
              },
              {
                condition: signal.PriceCrMA200 && MACDPositive,
                hook: 'SLACK_WEBHOOKS_D_US200',
              },
            ];

            const matched = webhookMap.find((w) => w.condition);

            if (matched) {
              await this.webhooksService.sendSlackNotificationVN(
                [ticker],
                lastData,
              watchlist.includes(ticker)?'SLACK_WEBHOOKS_WATCHLIST':matched.hook,
              );
            }
          }
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

  @Cron('0 0 * * 1-5', {
    timeZone: 'America/Los_Angeles',
  })
  async runfullonms() {
    // delete old data from firebase
    const today = this.stockHelperService.getDateNDaysAgo(0); // Get today's date
    await this.webhooksService.delete();
    this.stockHelperService.ListMA50On1day = []; // Clear the list at the start of each run
    await this.SendEverydayService('EARLY_AB200', '200AB_LESS_01', '1day');
    await this.send1chanel('200AB_LESS_05', '1day');
    await this.webhooksService.sendSlackNotification(
      `START+${today}+START================================`,
      '1day',
    );

    await this.runAllWatchLists();

    await this.SendEverydayService('EARLY_AB200', '200AB_LESS_01', '1day');
    await this.send1chanel('200AB_LESS_05', '1day');
    await this.webhooksService.sendSlackNotification(
      `END+${today}+END================================`,
      '1day',
    );

    this.stockHelperService.ListMA50On4hour = [];
    await this.SendEverydayService(
      '200BL_OV_NEG_01',
      '200BL_OV_NEG_05',
      '4hour',
    );
    await this.send1chanel('200AB_LESS_1', '4hour');
    await this.webhooksService.sendSlackNotification(
      `START+${today}+START================================`,
      '4hour',
    );

    await this.runAllOn1h([
      ...(this.stockHelperService.ListMA50On1day || []),
    ]);

    await this.webhooksService.sendSlackNotification(
      `END+${today}+END================================`,
      '4hour',
    );
    await this.SendEverydayService(
      '200BL_OV_NEG_01',
      '200BL_OV_NEG_05',
      '4hour',
    );
    await this.send1chanel('200AB_LESS_1', '4hour');
  }

  async runAllWatchLists() {
    const today = this.stockHelperService.getDateNDaysAgo(0);
  
    const webhooks = ['SLACK_WEBHOOKS_D_US50', 'SLACK_WEBHOOKS_D_US100','SLACK_WEBHOOKS_D_US200','SLACK_WEBHOOKS_WATCHLIST'];
  
    const sendBatchNotification = async (type: 'START' | 'END') => {
      const message = `${type}+daily+${today}+${type}${'='.repeat(32)}`;
      await Promise.all(
        webhooks.map((hook) =>
          this.webhooksService.sendSlackNotification(message, hook),
        ),
      );
    };
    await sendBatchNotification('START');
    await Promise.all([
      this.USTIMERUN(
        StockSymbols.stock_usall_symbols,
        'EARLY_AB200',
        '200AB_LESS_01',
        0,
        '1day',
      ),
    ]);
    await sendBatchNotification('END');
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

  billion = 1000000000;
  above2billion = []
  private async getMarket(
    tickers: string[],
  ) {
    const limit = pLimit(1); // Limit the concurrency to 1 at a time

    const date = new Date();

    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {


        try {
          let data = await this.LocalPLWR.getMarketCap(ticker);
          // Process the data
          // console.table(data);
          const mkb = data.market_cap / this.billion; // Convert to billions
          console.log(`Market Cap for ${ticker}: ${mkb.toFixed(2)} billion USD`);
          if(mkb > 2){
          this.above2billion.push(ticker)}
          // this.logger.log(`${ticker} processed successfully.`);
        } catch (error) {
          // Send error notification and log the error
          this.logger.error(`Error processing ${ticker}: ${error.message}`);
        }
      }),
    );

    // Wait for all ticker promises to complete concurrently (with concurrency limit)
    await Promise.all(tickerPromises);
  }

  async writeAbove2BillionToFile() {
    // write to file
    const fs = require('fs');
    const filePath = 'above2billion.json';
    fs.writeFile(filePath, JSON.stringify(this.above2billion, null, 2), (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log(`Above 2 billion tickers saved to ${filePath}`);
      }
    });
  }
}
