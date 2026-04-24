// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
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
  today = this.stockHelperService.getDateNDaysAgo(0);
  dayago = 0
  rundayaogo = this.stockHelperService.getDateNDaysAgo(this.dayago);
  marketTarget = 2
  async onModuleInit() {

// await this.webhooksService.deleteAllMessages_SLack('C0AUN3H0JR5');
    // This runs ONCE when the app starts
    // this.stockHelperService.aboveMA50api = `dayago-${this.dayago}-` +this.rundayaogo;
    // await this.webhooksService.delete(this.stockHelperService.aboveMA50api); // reset firebase data for the day
    // await this.webhooksService.delete(this.stockHelperService.aboveMA50api+'-blowMA200'); // reset firebase data for the day
  //  await this.runfullonms();
  //  await this.runAllOn1day();
  // await this.webhooksService.delete(this.stockHelperService.aboveMA50api); // reset firebase data for the day
  // await this.webhooksService.delete(this.stockHelperService.aboveMA50api+'-blowMA200'); // reset firebase data for the day
  // await this.webhooksService.delete('runOn4hourInday'); // reset firebase data for the day
  // this.stockHelperService.aboveMA50api= this.rundayaogo
  //  await this.runOnly4h()
     //  await this.runAllOn4h()
    // await this.getMarket(DataSymbols.above2billion);
    // await this.stockHelperService.writeAbove2BillionToFile(this.aboveTarget,`Above_${this.marketTarget}_Billion`);
    // await this.stockHelperService.writeAbove2BillionToFile(this.BelowTarget,`Below_${this.marketTarget}_Billion`);
    // this.stockHelperService.ListMA50On1day = await this.LocalPLWR.getArrSymbolFFire('${this.stockHelperService.aboveMA50api}/alldata/1day')as string[];
    // const x = await this.LocalPLWR.getArrSymbolFFire(`${this.stockHelperService.aboveMA50api}/alldata/lastab/1day`)as string[];
    // await this.getMarket(this.stockHelperService.ListMA50On1day )
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
    const limit = pLimit(2); // Limit the concurrency to 1 at a time

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
            timeframe,this.dayago
          );

          if (!Array.isArray(data) || data.length < 2) {
            this.logger.warn(`⚠️ No valid data for ${ticker} (${timeframe})`);
            return;
          }
          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];

          console.log(`✅ Processing ${ticker} on ${timeframe} at ${lastData.date}`);
          // Process the data
          await this.webhooksService.stockRSILAUP(
            data,
            ticker,
            timeframe,
            B_Channel,
            HT_Channel,
          );
          await this.webhooksService.runALLOn_MA50(
            data,
            ticker,
            timeframe,
            B_Channel,
            HT_Channel,
          );
          if (timeframe === '1day') {

            const signal =
              await this.stockHelperService.BuyOnly_StochRSICrossAB200(
                lastData,
                secondLastData,
              );
            // console.log(`Signal for ${ticker} on ${timeframe}:`, signal);
            const MACDPositive = lastData.divergence > 0;
            const sp500 = DataSymbols.stock_500_symbols.includes(ticker) ? '(SP500)-' : ''
            if(signal && signal.RSI15up){
              await this.webhooksService.FireBaseApi("put", `stock-related/RSI/RSI15AL/${timeframe}/${this.today}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
              await this.webhooksService.sendDiscord(
                `${sp500}SBUY-RSI15AL-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
                `${ticker}-ON-${timeframe}`,
                lastData,
                'RSI15AL',
                data,
              );
            }else if(signal && signal.RSI20up){
              await this.webhooksService.FireBaseApi("put", `stock-related/RSI/RSIALERT/${timeframe}/${this.today}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
              await this.webhooksService.sendDiscord(
                `${sp500}SBUY-RSI20AL-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
                `${ticker}-ON-${timeframe}`,
                lastData,
                'RSIALERT',
                data,
              );
            }else if(signal && signal.RSI25up){
              await this.webhooksService.FireBaseApi("put", `stock-related/RSI/RSI25AL/${timeframe}/${this.today}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
              await this.webhooksService.sendDiscord(
                `${ sp500}SBUY-RSI25AL-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
                `${ticker}-ON-${timeframe}`,
                lastData,
                'RSI25AL',
                data,
              );
            }else if(signal && signal.RSI30up){
              await this.webhooksService.FireBaseApi("put", `stock-related/RSI/RSI30AL/${timeframe}/${this.today}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
              await this.webhooksService.sendDiscord(
                `${sp500}SBUY-RSI30AL-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
                `${ticker}-ON-${timeframe}`,
                lastData,
                'RSI30AL',
                data,
              );
            };
            if (!signal) return;
            const stockRSILAUP = lastData.StochRSI_K - lastData.StochRSI_D > 0;
            const macdCross = await this.stockHelperService.macdCross(
              lastData,
              secondLastData,
            );
            const webhookMap = [
              {
                condition: signal.PriceCrMA50 ,
                hook: 'SLACK_WEBHOOKS_D_US50',
              },
              {
                condition: signal.PriceCrMA100 ,
                hook: 'SLACK_WEBHOOKS_D_US100',
              },
              {
                condition: signal.PriceCrMA200 ,
                hook: 'SLACK_WEBHOOKS_D_US200',
              },
            ];

            const matched = webhookMap.find((w) => w.condition);

            if (matched) {
              await this.webhooksService.sendSlackNotificationVN(timeframe,
                [ticker],
                lastData,
                DataSymbols.watchlist.includes(ticker)?'SLACK_WEBHOOKS_WATCHLIST':matched.hook,
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
  async runfullonms(stocklist = DataSymbols.allabove500million){
    // delete old data from firebase
    const today = this.stockHelperService.getDateNDaysAgo(0); // Get today's date
    await this.webhooksService.deleteFirebase(this.stockHelperService.aboveMA50api); // reset firebase data for the day
    await this.webhooksService.deleteFirebase(this.stockHelperService.aboveMA50api+'-aboveMA200'); // reset firebase data for the day
    await this.webhooksService.deleteFirebase('runOn4hourInday'); // reset firebase data for the day
    this.stockHelperService.ListMA50On1day = []; // Clear the list at the start of each run
    await this.webhooksService.SendDcChannels(['EARLY_AB200', '200AB_LESS_01', 'RSI15AL', 'RSIALERT','RSI25AL', 'RSI30AL','200AB_LESS_05','MA_AB_5_20'],this.logger,'1day');
    await this.webhooksService.sendSlackNotification(
      `START+${today}+START=1day=(aboveMA50Count >= 3 && MACDPositive)==`,
      '1day',
    );

    await this.runAllWatchLists(stocklist);

    await this.webhooksService.SendDcChannels(['EARLY_AB200', '200AB_LESS_01', 'RSI15AL', 'RSIALERT','RSI25AL', 'RSI30AL','200AB_LESS_05','MA_AB_5_20'],this.logger, '1day');
    await this.webhooksService.sendSlackNotification(
      `END+${today}+END=1day=(aboveMA50Count >= 3 && MACDPositive)===`,
      '1day',
    );

    this.stockHelperService.ListMA50On4hour = [];
    await this.webhooksService.SendDcChannels(['200BL_OV_NEG_01','200BL_OV_NEG_05','200AB_LESS_1'],this.logger,'4hour',);
    await this.webhooksService.sendSlackNotification(
      `START+${today}+START=4hour=(aboveMA50Count >= 3 && MACDPositive)===`,
      '4hour',
    );

    // await this.runAllOn4h([
    //   ...(this.stockHelperService.ListMA50On1day || []),
    // ]);

    await this.runAllOn4h(stocklist);

    await this.webhooksService.sendSlackNotification(
      `END+${today}+END=4hour=(aboveMA50Count >= 3 && MACDPositive)==`,
      '4hour',
    );
    await this.webhooksService.SendDcChannels(['200BL_OV_NEG_01','200BL_OV_NEG_05','200AB_LESS_1'],this.logger,'4hour',);
  }

  async runAllWatchLists(stocklist = DataSymbols.allabove500million) {
    const today = this.stockHelperService.getDateNDaysAgo(0);
  
    const webhooks = ['SLACK_WEBHOOKS_D_US50', 'SLACK_WEBHOOKS_D_US100','SLACK_WEBHOOKS_D_US200','SLACK_WEBHOOKS_WATCHLIST','SLACK_WEBHOOKS_J2DAY','SLACK_WEBHOOKS_J3DAY','SLACK_WEBHOOKS_US_MACDCR',];
  
    const sendBatchNotification = async (type: 'START' | 'END') => {
      const message = `${type}+daily+${today}+${type}${'='.repeat(32)}`;
      await Promise.all(
        webhooks.map((hook) =>
          this.webhooksService.sendSlackNotification(message, hook),
        ),
      );
    };
    await sendBatchNotification('START');
    await this.runAllOn1day(stocklist);
    await sendBatchNotification('END');
    await this.webhooksService.sendlast('EARLY_AB200', '200AB_LESS_01');
  }

  async runAllOn1day(stocklist = DataSymbols.allabove500million) {
    await Promise.all([
      this.USTIMERUN(
        stocklist,
        'EARLY_AB200',
        '200AB_LESS_01',
        0,
        '1day',
      ),
    ]);
  }
  async runOnly4h(stocklist = DataSymbols.allabove500million) {
    await Promise.all([
      this.USTIMERUN(
        stocklist,
        '200BL_OV_NEG_01',
        '200BL_OV_NEG_05',
        0,
        '4hour',
      ),
    ]);
  }
  async runAllOn4h(stocklist = DataSymbols.allabove500million) {
    await this.webhooksService.deleteFirebase('NextRound/4hour','stockRSILAUP');
    const tslaDc = `<https://discord.com/channels/1306113720979689523/1380037316143349922|4HOUR_RUN_LOOK_TSLA_DC>`
    const smciDc = `<https://discord.com/channels/1306113720979689523/1348653615992143924|4HOUR_RUN_LOOK_SMCI_DC>`
    const macd4huorDc = `<https://discord.com/channels/1306113720979689523/1436948457247080589|4HOUR_RUN_LOOK_MACDCRAB_DC>`
    const message_tsla = `${tslaDc}${'='.repeat(32)}`;
    const message_smci = `${smciDc}${'='.repeat(32)}`;
    this.webhooksService.sendSlackNotification('START_'+message_tsla, 'SLACK_WEBHOOKS_4h_3C_AB');
    this.webhooksService.sendSlackNotification('START_'+message_smci, 'SLACK_WEBHOOKS_4h_3C_BL');
    this.webhooksService.sendSlackNotification('START_'+macd4huorDc, 'SLACK_WEBHOOKS_4h_CROSS');
    const slma50 = `**[LOOK_US30ABMA50_SL](https://atllc-workspace.slack.com/archives/C0AQJHR0BC6)**`
    const slma100 = `**[LOOK_US30ABMA100_SL](https://atllc-workspace.slack.com/archives/C0AQH7LDM1B)**`
    const slmacd = `**[LOOK_US30ABMA100_SL](https://atllc-workspace.slack.com/archives/C0ASE94TZ08)**`
    await this.webhooksService.SendDcChannels(['TSLA'],this.logger,`START_4OUR_${slma50}`);
    await this.webhooksService.SendDcChannels(['SMCI'],this.logger,`START_4OUR_${slma100}`);
    await this.webhooksService.SendDcChannels(['MA_AB_5_200'],this.logger,`START_4OUR_${slmacd}`);
    await this.runOnly4h(stocklist);
    await this.webhooksService.sendlast('200BL_OV_NEG_01', '200BL_OV_NEG_05');
    this.webhooksService.sendSlackNotification('END_'+message_tsla, 'SLACK_WEBHOOKS_4h_3C_AB');
    this.webhooksService.sendSlackNotification('END_'+message_smci, 'SLACK_WEBHOOKS_4h_3C_BL');
    this.webhooksService.sendSlackNotification('END_'+macd4huorDc, 'SLACK_WEBHOOKS_4h_CROSS');
    await this.webhooksService.SendDcChannels(['TSLA'],this.logger,`END_4HOUR_${slma50}`);
    await this.webhooksService.SendDcChannels(['SMCI'],this.logger,`END_4OUR_${slma100}`);
    await this.webhooksService.SendDcChannels(['MA_AB_5_200'],this.logger,`END_4HOUR_${slmacd}`);
  }

  

  billion = 1000000000;
  aboveTarget = []
  BelowTarget = []
  private async getMarket(
    tickers: string[],
  ) {
    const limit = pLimit(8); // Limit the concurrency to 1 at a time

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
          if(mkb > this.marketTarget){
          this.aboveTarget.push(ticker)}else{
            this.BelowTarget.push(ticker)
          }
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
}
