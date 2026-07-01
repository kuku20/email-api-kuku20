// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
import * as Timer from './compareTime';
import pLimit from 'p-limit';
@Injectable()
export class TasksBullBearLocalService {
  allkeys = 'all'; // test
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksBullBearLocalService.name);
  endpointFolder = 'stock-price-check';
  runOnceAtOpen = false
  aboveList = []
  aboveListUP = []
  belowList = []
  belowListUp = []
  async onModuleInit() {

    // await this.bullBear('4hour')
    // await this.bullBear('2hour')
    // await this.bullBear('1hour')
    // await this.bullBear('30min')
    // await this.bullBear('5min')
    // await this.bullBear('4hour')
    // await this.bullBear('4hour')
    // await this.delete(-1)
    // await this.delete(0)

    // const bullbear = Object.keys(DataSymbols.watchlistBB)
    // console.log(bullbear.length)
    // // await this.bullBear('5min')
    // console.log(bullbear.join(','))
  }


  async  USTIMERUN(
    intickers: string[],
    api: any,
    B_Channel,
    HT_Channel,
    delay,
    timeframe = '5min',
  ) {
    // const now = new Date().toLocaleString('en-US', {
    //   timeZone: 'America/New_York',
    // });
    // if (intickers.length < 1) {
    //   this.logger.log(`Don't have symbol ${timeframe} check (${now} ET)`);
    //   return;
    // }
    // if (!this.stockHelperService.isMarketOpen()) {
    //   this.logger.log(
    //     `🕒 Market closed — skipping ${timeframe} check (${now} ET)`,
    //   );
    //   return;
    // }
    // this.logger.log(
    //   `✅ Market open — running ${timeframe} trading logic (${now} ET)`,
    // );
    const today = new Date().toLocaleString('sv-SE', { timeZone: 'America/Chicago' }).replace(/[^\d]/g, '-');
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
          // let data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
           let data =  await this.LocalPLWR.OtherFirebaseData("get", `https://angularitv-default-rtdb.firebaseio.com/stockRSILAUP/TWELLALL/${timeframe}/${ticker}/data.json`, '')

            // data = await this.LocalPLWR.getTickerFullChart_POLYGON2(ticker, timeframe);
          // await this.LocalPLWR.OtherFirebaseData("put", `https://angularitv-default-rtdb.firebaseio.com/stockRSILAUP/TWELLALL/${timeframe}/${ticker}.json`, {data: data.slice(-400)})
          const timeframeMap: Record<string, number> = {
            '5min': 67,
            '15min': 26,
            '30min': 13,
            '1hour': 7,
            '2hour': 4,
            '4hour': 2,
          };
          
          // Example input
          const ladata = timeframeMap[timeframe] || 1;
          const latestData = data[data.length - 1];
          // 15min = 26, 30min = 13 ,1hour = 7 , 2hour = 4, 4hour = 2
          const lastDataIndex = data.length - ladata
          const lastData = data[data.length - ladata];
          const secondLastData = data[data.length - ladata-1];
          const nextLast1 = data[lastDataIndex+1]
          const nextLast2 = data[lastDataIndex+2]
          const nextLast3 = data[lastDataIndex+3]
          const nextLast4 = data[lastDataIndex+4]
          const maxOfFour = Math.max(nextLast1.high,nextLast2.high,nextLast3.high,nextLast4.high,)
          data = data.slice(0,data.length - ladata+1)
          // const aboveOrbelowMA300 = lastData.close < lastData.MA50
          const condition = lastData.divergence > 0 && secondLastData.divergence < 0
          const OscConditionL = lastData.OSC > lastData.OSCSignal
          const lastDivergence = lastData.divergence > secondLastData.divergence
          const lastMA9over15 = lastData.MA9 > lastData.MA15
          const lastStochRSI = lastData.StochRSI_K > lastData.StochRSI_D 
          const preStockRSI = secondLastData.StochRSI_K < secondLastData.StochRSI_D 
          const StochRSICross = preStockRSI && lastStochRSI
          const lastCLosevss = lastData.close > secondLastData.close
          const aboveOrBelowma50 = lastData.close > lastData.MA200
          const Belowma50 = secondLastData.close < secondLastData.MA100
          const allCondition = OscConditionL && lastDivergence && lastMA9over15 && lastStochRSI && lastCLosevss && aboveOrBelowma50
          // const textdisplay =  
          const text = `=${lastData?.close}=VS=${maxOfFour}=`
          const goup = lastData?.close<maxOfFour ? 'SBUY':"SSELL"
          const percentagevsma200 = (lastData.close-lastData.MA200)
          const oneTimeAt9h30 =lastData.date.includes('09:30:00')&& lastData.close >= lastData.MA9 && lastData.MA9 >= lastData.MA15 && lastData.MA15 >= lastData.MA50 && lastData.MA50 >= lastData.MA100 && lastData.MA100 >= lastData.MA200 && lastData.MA200 >= lastData.MA300
          // if(condition && aboveOrBelowma50){
          const textDetail = oneTimeAt9h30?'Above all buy':StochRSICross?'StochRSICross': condition && aboveOrBelowma50?'CrossnAb200':''
          const result = this.stockHelperService.getMACDRange(data);
          const compareMACDLine = lastData.MACDLine < result.mid
          const blMa200MACDPMA50cR = lastData.close < lastData.MA200 && lastData.divergence > 0 && (lastData.close > lastData.MA50 && secondLastData.close < secondLastData.MA50)
          if(oneTimeAt9h30){
            await this.webhooksService.sendSlackNotificationVN(
              timeframe,
              [ticker],
              lastData,
              this.stockHelperService.INTRA_30M_SL_.MACDCR_200,
              textDetail+' '+maxOfFour,
            );
            await this.webhooksService.sendDiscord(
              `${goup}-${textDetail}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}-${textDetail}-${text}`,
              lastData,
              'WATCHLIST', 
              data,
            );
            return
          }else if((StochRSICross || condition && aboveOrBelowma50)){
            await this.webhooksService.sendSlackNotificationVN(
              timeframe,
              [ticker],
              lastData,
              StochRSICross?this.stockHelperService.INTRA_30M_SL_.MACDCR_50:this.stockHelperService.INTRA_30M_SL_.MACDCR_100,
              textDetail+' '+maxOfFour,
            );
            this.aboveList.push(ticker)
            if(goup==='SBUY'){
              this.aboveListUP.push(ticker)
            }
            await this.webhooksService.sendDiscord(
              `${goup}-${textDetail}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}-${textDetail}-${text}`,
              lastData,
              StochRSICross?B_Channel:HT_Channel, 
              data,
            );
          }else if(blMa200MACDPMA50cR){
            await this.webhooksService.sendSlackNotificationVN(
              timeframe,
              [ticker],
              lastData,
              this.stockHelperService.INTRA_30M_SL_.WATCH,
              'blMa200MACDPMA50cR'+maxOfFour,
            );
            await this.webhooksService.sendDiscord(
              `${goup}-${'blMa200MACDPMA50cR'}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}-${'blMa200MACDPMA50cR'}-${text}`,
              lastData,
              'US_15M_HT', 
              data,
            );
          }else{
            this.belowList.push(ticker)
            if(goup==='SBUY'){
              this.belowListUp.push(ticker)
            }
            // await this.webhooksService.sendDiscord(
            //   `${goup}-condition -${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
            //   `${ticker}-ON-${timeframe}-condition-${text}`,
            //   lastData,
            //   HT_Channel, 
            //   data,
            // );
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
  @Cron('*/15 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async bullBear(timeframe = '5min',symbols= DataSymbols.watchlist){
    try {
      this.webhooksService.sendSlackNotification('daily+2026-05-01================================', this.stockHelperService.INTRA_30M_SL_.MACDCR_50)
      this.webhooksService.sendSlackNotification('daily+2026-05-01================================', this.stockHelperService.INTRA_30M_SL_.MACDCR_100)
      this.webhooksService.sendSlackNotification('daily+2026-05-01================================', this.stockHelperService.INTRA_30M_SL_.MACDCR_200)
      this.webhooksService.sendSlackNotification('daily+2026-05-01================================', this.stockHelperService.INTRA_30M_SL_.WATCH)
      await this.USTIMERUN(
        symbols,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
0,
        // `${this.runon15or30}min`,
        timeframe,
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
      this.runOnceAtOpen = false
      this.webhooksService.sendSlackNotification('daily+2026-05-01================================', this.stockHelperService.INTRA_30M_SL_.MACDCR_50)
      this.webhooksService.sendSlackNotification('daily+2026-05-01================================', this.stockHelperService.INTRA_30M_SL_.MACDCR_100)
      this.webhooksService.sendSlackNotification('daily+2026-05-01================================', this.stockHelperService.INTRA_30M_SL_.MACDCR_200)
      this.webhooksService.sendSlackNotification('daily+2026-05-01================================', this.stockHelperService.INTRA_30M_SL_.WATCH)
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