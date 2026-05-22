// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
import pLimit from 'p-limit';
@Injectable()
export class TasksBullBearService {
  allkeys = 'all'; // test
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksBullBearService.name);
  endpointFolder = 'stock-price-check';
  runOnceAtOpen = false
  aboveList = []
  aboveListUP = []
  belowList = []
  belowListUp = []
  async onModuleInit() {
    // this.webhooksService.deleteSLChannel(['SLACK_WEBHOOKS_US50','SLACK_WEBHOOKS_US200','SLACK_WEBHOOKS_US100','SLACK_WEBHOOKS_WATCHLIST'])
    // this.webhooksService.deleteSLChannel(['C0B0HRF04EL','C0AV30D721L','C0AV52BFMDG','C0AV1KQGS3F','C0AV988SHDJ','C0B02DZU0KB','C0AUN3H0JR5','SLACK_WEBHOOKS_HOLDING','SLACK_WEBHOOKS_US50','SLACK_WEBHOOKS_US100','SLACK_WEBHOOKS_US200','SLACK_WEBHOOKS_MACDCRAB','SLACK_WEBHOOKS_WATCHLIST'])
    // await this.delete(-1)
    // await this.delete(0)
    // await this.bullBear()
  }

  async getholdingList() {
    const holdingObj = await this.LocalPLWR.FireBaseApi('get',`stock-related/holding.json`,'')
    this.stockHelperService.HoldingList = Object.keys(holdingObj);
    console.log(`✅ Loaded stock-related/holding: has ${this.stockHelperService.HoldingList.length} symbols`);
    return this.stockHelperService.HoldingList;
  }

  async  USTIMERUN(
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
    await this.webhooksService.SendDcChannels([B_Channel, HT_Channel,],this.logger,'START='+timeframe);
    const tickers = intickers;
    await this.processTickers(
      tickers,
      timeframe,
      api,
      B_Channel,
      HT_Channel,
      delay,
    );
    await this.webhooksService.SendDcChannels([B_Channel, HT_Channel,],this.logger,'END='+timeframe);
  }

  private async processTickers(
    tickers: string[],
    timeframe: string,
    apikey: string,
    B_Channel,
    HT_Channel,
    delay = 2,
  ) {
    const limit = pLimit(8); // Limit the concurrency to 8 at a time

    const washselllists =
      (await this.LocalPLWR.loadWashSellList()) ||
      this.LocalPLWR.getWashSellList();
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));

    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {
        if (washselllists?.includes(ticker)) {
          console.log(`⏭️ Skipping ${ticker} — in wash sell list`);
          return; // Skip this ticker and move on
        }

        try {
          let data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];
          const condition = lastData.divergence > 0 && secondLastData.divergence < 0
          const lastStochRSI = lastData.StochRSI_K > lastData.StochRSI_D 
          const preStockRSI = secondLastData.StochRSI_K < secondLastData.StochRSI_D 
          const StochRSICross = preStockRSI && lastStochRSI

          const lastMA9overMA15 = lastData.MA9 > lastData.MA15 
          const sndMA9overMA15 =  secondLastData.MA9 < secondLastData.MA15 
          const MA9crosMA20 = lastMA9overMA15 && sndMA9overMA15

          const aboveOrBelowma50 = lastData.close > lastData.MA200
          const oneTimeAt9h30 =lastData.date.includes('09:30:00')&& lastData.close >= lastData.MA9 && lastData.MA9 >= lastData.MA15 && lastData.MA15 >= lastData.MA50 && lastData.MA50 >= lastData.MA100 && lastData.MA100 >= lastData.MA200 && lastData.MA200 >= lastData.MA300
          const textDetail = oneTimeAt9h30?'Above all buy':StochRSICross?'StochRSICross': condition && aboveOrBelowma50?'CrossnAb200':''
          const blMa200MACDPMA50cR = lastData.close < lastData.MA200 && lastData.divergence > 0 && (lastData.close > lastData.MA50 && secondLastData.close < secondLastData.MA50)
          const macdCrossAB = lastData.divergence > 0 && secondLastData.divergence < 0
          if(oneTimeAt9h30){
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              'SLACK_WEBHOOKS_US200',textDetail,
              this.runon15or30
            );
            await this.webhooksService.sendDiscord(
              `${textDetail}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-${timeframe}-${textDetail}`,
              lastData,
              'WATCHLIST', 
              data,
            );
            return
          }else if((StochRSICross || condition && aboveOrBelowma50)){
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              StochRSICross?'SLACK_WEBHOOKS_US50':'SLACK_WEBHOOKS_US100',textDetail+' ',
              this.runon15or30
            );
            this.aboveList.push(ticker)
            await this.webhooksService.sendDiscord(
              `${textDetail}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-${timeframe}-${textDetail}`,
              lastData,
              StochRSICross?B_Channel:HT_Channel, 
              data,
            );
          }else if(blMa200MACDPMA50cR){
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              'SLACK_WEBHOOKS_WATCHLIST','blMa200MACDPMA50cR',
              this.runon15or30
            );
            await this.webhooksService.sendDiscord(
              `${'blMa200MACDPMA50cR'}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-${timeframe}-${'blMa200MACDPMA50cR'}`,
              lastData,
              'US_15M_HT', 
              data,
            );
          } else if(MA9crosMA20){
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              'SLACK_WEBHOOKS_WATCHLIST','MA9crosMA20',
              this.runon15or30
            );
            await this.webhooksService.sendDiscord(
              `${'MA9crosMA20'}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-${timeframe}-${'MA9crosMA20'}`,
              lastData,
              'US_15M_HT', 
              data,
            );
          } else if(macdCrossAB){
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              'SLACK_WEBHOOKS_MACDCRAB','macdCrossAB',
              this.runon15or30
            );
            await this.webhooksService.sendDiscord(
              `${'macdCrossAB'}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-${timeframe}-${'macdCrossAB'}`,
              lastData,
              'US_30M_HT', 
              data,
            );
           }
          this.logger.log(`${ticker} processed successfully.`);
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ${error.message} \n url: http://localhost:4200/price-log/${ticker}?daysRange=500`,
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
  runon15or30 :'30'|'15'|'5'= '5';
  @Cron('*/5 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async bullBear(timeframe = '5min',symbols= DataSymbols.watchlist){
    if (!this.stockHelperService.shouldRunTradingLogicUS(`${this.runon15or30}min`,this.logger)) {
      return;
    }
    const time = new Date().toLocaleString('en-US', {timeZone: 'America/New_York',});
    try {
      this.webhooksService.sendSlackNotification(`${time}================================`, 'SLACK_WEBHOOKS_US50')
      this.webhooksService.sendSlackNotification(`${time}================================`, 'SLACK_WEBHOOKS_US100')
      this.webhooksService.sendSlackNotification(`${time}================================`, 'SLACK_WEBHOOKS_WATCHLIST')
      this.webhooksService.sendSlackNotification(`${time}================================`, 'SLACK_WEBHOOKS_MACDCRAB')
      await this.USTIMERUN(
        symbols,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
        3,
        timeframe,
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
      this.runOnceAtOpen = false
      const percentof = this.aboveListUP.length/this.aboveList.length
      const percentofeve = this.belowListUp.length/this.belowList.length
      this.logger.log(percentof)
      this.logger.error(percentofeve)
    }
  }

  async delete(dayago = 1) {
    const yesterday = this.stockHelperService.getDateNDaysAgo(dayago);
    const Channels = [
      'US_ALL','USSTOCK_WATCH','WATCHLIST','US_15M_HT'
    ]; // example list

    await new Promise((resolve) => setTimeout(resolve, 0 * 60 * 1000));
    for (const channel of Channels) {
      // Log completion
      this.logger.error(`✅ Finished sending for`, channel, yesterday);

      // DELETE two days ago messages
      await this.webhooksService.deleteMessages(channel, yesterday);
      this.logger.error(`🗑️ Deleted old messages for`, channel, yesterday);
    }
  }
}