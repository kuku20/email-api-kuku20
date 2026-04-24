import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import pLimit from 'p-limit';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as DataSymbols from './dto/chartData';
@Injectable()
export class TasksUS_ALL_MK_4HOUR_Service {
  allkeys = 'all'; // test
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksUS_ALL_MK_4HOUR_Service.name);
  async onModuleInit() {
  //   this.stockHelperService.runOn4hourInday = await this.LocalPLWR.getArrSymbolFFire(`runOn4hourInday/4hour`)as string[];
  // await this.runAllOn4h()
  // await this.runAllWatchLists2h()
  // await this.runOnly2h()
  // await this.runOnly1h()
  // await this.runAllOn4h()
  // await this.runAllWatchLists2h()
  // // this.stockHelperService.NextRound_2hourALL  = await this.LocalPLWR.getArrSymbolFFire(`NextRound/2hour`,'stockRSILAUP') || DataSymbols.allabove500million
  // this.stockHelperService.NextRound_2hourALL  = await this.LocalPLWR.getArrSymbolFFire(`macdCross_AB/All/2hour`,'stockRSILAUP')
  // console.log('NextRound_2hourALL:', this.stockHelperService.NextRound_2hourALL);
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
          let  data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];

          console.log(`✅ Processing ${ticker} on ${timeframe} at ${lastData.date}`);
          // Process the data
          if(timeframe === '4hour'){
          await this.webhooksService.runALLOn_MA50(
            data,
            ticker,
            timeframe,
            B_Channel,
            HT_Channel,
          );}
          await this.webhooksService.stockRSILAUP(
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
  @Cron('40 9,13 * * 1-5', { timeZone: 'America/New_York' }) // Every day at 9:40 AM and 1:40 PM ET on weekdays
  async runAllOn4h() {
    // this.stockHelperService.runOn4hourInday = await this.LocalPLWR.getArrSymbolFFire(`runOn4hourInday/4hour`)as string[];
    // await this.webhooksService.deleteFirebase('macdCross_AB','stockRSILAUP');
    // this.stockHelperService.NextRound_4hourALL  =await this.LocalPLWR.getArrSymbolFFire(`NextRound/4hour`,'stockRSILAUP') || DataSymbols.allabove500million
    this.stockHelperService.NextRound_4hourALL  = DataSymbols.allabove500million
    if( this.stockHelperService.NextRound_4hourALL.length === 0){
      this.logger.warn('No stocks to process for 4-hour run.');
      return;
    }
    // await this.webhooksService.deleteFirebase('NextRound/4hour','stockRSILAUP');

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

    await this.runOnly4h(this.stockHelperService.NextRound_4hourALL);

    await this.webhooksService.sendlast('200BL_OV_NEG_01', '200BL_OV_NEG_05');
    this.webhooksService.sendSlackNotification('END_'+message_tsla, 'SLACK_WEBHOOKS_4h_3C_AB');
    this.webhooksService.sendSlackNotification('END_'+message_smci, 'SLACK_WEBHOOKS_4h_3C_BL');
    this.webhooksService.sendSlackNotification('END_'+macd4huorDc, 'SLACK_WEBHOOKS_4h_CROSS');
    await this.webhooksService.SendDcChannels(['TSLA'],this.logger,`END_4HOUR_${slma50}`);
    await this.webhooksService.SendDcChannels(['SMCI'],this.logger,`END_4OUR_${slma100}`);
    await this.webhooksService.SendDcChannels(['MA_AB_5_200'],this.logger,`END_4HOUR_${slmacd}`);
  }

  async runOnly4h(stocklist: string[] = this.stockHelperService.NextRound_4hourALL) {
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

  // @Cron('6 9-15 * * 1-5', { timeZone: 'America/New_York' }) // Every day at 9:06 AM, 10:06 AM, ..., 3:06 PM ET on weekdays

  @Cron('36 9-15/2 * * 1-5', { timeZone: 'America/New_York' }) // 9:36 AM, 11:36 AM, 1:36 PM ET (weekdays)
 async runAllWatchLists2h() {
    // this.stockHelperService.NextRound_2hourALL  = await this.LocalPLWR.getArrSymbolFFire(`NextRound/2hour`,'stockRSILAUP') || DataSymbols.allabove500million
    this.stockHelperService.NextRound_2hourALL  = DataSymbols.allabove500million
    console.log('NextRound_2hourALL:', this.stockHelperService.NextRound_2hourALL.length);

    const sl1hourCr = `**[LOOK_US30ABMA50_SL](https://atllc-workspace.slack.com/archives/C081A4CHMJ4)**`
    const dcMA_AB_20_50 = `<https://discord.com/channels/1306113720979689523/1436948534346911904|1HOUR_RUN_LOOK_MACDCRAB_DC>`
    const message_sl1hourCr = `${sl1hourCr}${'='.repeat(32)}`;
    this.webhooksService.sendSlackNotification('START_'+dcMA_AB_20_50, 'SLACK_WEBHOOKS_2h_CROSS');
    await this.webhooksService.SendDcChannels(['MA_AB_20_50'],this.logger,`START_2HOUR_${message_sl1hourCr}`);

    await  this.runOnly2h(this.stockHelperService.NextRound_2hourALL)

    await this.webhooksService.SendDcChannels(['MA_AB_20_50'],this.logger,`END_2HOUR_${message_sl1hourCr}`);
    this.webhooksService.sendSlackNotification('END_'+dcMA_AB_20_50, 'SLACK_WEBHOOKS_2h_CROSS');
  }



  async runOnly2h(stocklist: string[] = this.stockHelperService.NextRound_2hourALL) {
    if( stocklist.length === 0){
      this.logger.warn('No stocks to process for 2-hour run.');
      return;
    }
    // await this.webhooksService.deleteFirebase('NextRound/1hour','stockRSILAUP');
    await Promise.all([
      this.USTIMERUN(
        stocklist,
        '200BL_OV_NEG_01',
        '200BL_OV_NEG_05',
        0,
        '2hour',
      ),
    ]);
  }
}