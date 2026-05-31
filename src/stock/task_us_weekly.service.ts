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
export class Tasks_US_WEEKLY {
  allkeys = 'all'; // test
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(Tasks_US_WEEKLY.name);
  today = this.stockHelperService.getDateNDaysAgo(0);
  dayago = 0// end of toi 4
  rundayaogo = this.stockHelperService.getDateNDaysAgo(this.dayago);
  async onModuleInit() {
    // await this.cronRunWeekly()
    // await this.dailyCleanup()
    // const data =  await this.LocalPLWR.getTickerFullChart_POLYGON2(
    //   "TSLA",
    //   '1week',this.dayago
    // );
    // console.log(data.slice(-1), data.length)
    // let  data2 = await this.LocalPLWR.TwReveseNOAPI("TSLA",'1week');
    // console.log(data2.slice(-1), data2.length)
    // const date = '2026-05-24'
    // const OscCrossAb = await this.LocalPLWR.FireBaseApi('get',`stock-related/OscCrossAb/1week/${date}.json`,'')
    // const macdCross = await this.LocalPLWR.FireBaseApi('get',`stock-related/macdCross/1week/${date}.json`,'')
    // const stochRSICros = await this.LocalPLWR.FireBaseApi('get',`stock-related/stochRSICros/1week/${date}.json`,'')
    // console.log('OscCrossAb', Object.keys(OscCrossAb || {}).length)
    // console.log('macdCross', Object.keys(macdCross || {}).length)
    // console.log('stochRSICros', Object.keys(stochRSICros || {}).length)
  }

  async dailyCleanup() {    
    this.stockHelperService.setSlackToken('SLACK_BOT_TOKEN_WEEKLY');
    this.webhooksService.deleteSLChannel(Object.values(this.stockHelperService.WEEKLY_SL))
  }

  @Cron('0 0 * * 6', {
    timeZone: 'America/Los_Angeles',
  })
  async cronRunWeekly(stocklist = DataSymbols.above5billion) {
    this.stockHelperService.setSlackToken('SLACK_BOT_TOKEN_WEEKLY');
    const combine = [...stocklist, ...DataSymbols.watchlist]
    const uniqueCombine = Array.from(new Set(combine));

    const today = this.stockHelperService.getDateNDaysAgo(0);

    const webhooks = [...Object.values(this.stockHelperService.WEEKLY_SL)]
    const sendBatchNotification = async (type: 'START' | 'END') => {
      const message = `${type}+weekly+${today}+${type}${'='.repeat(32)}`;
      await Promise.all(
        webhooks.map((hook) =>
          this.webhooksService.sendSlackNotification(message, hook),
        ),
      );
    };
    await sendBatchNotification('START');
    await this.runWeekly(uniqueCombine);
    await sendBatchNotification('END');
  }
  async runWeekly(stocklist) {
    await Promise.all([
      this.USTIMERUN2(
        stocklist,
        '200BL_OV_NEG_01',
        '200BL_OV_NEG_05',
        0,
        '1week',
      ),
    ]);
  }

  async USTIMERUN2(
    intickers: string[],
    B_Channel,
    HT_Channel,
    delay,
    timeframe = '5min',
  ) {
    const tickers = intickers;
    await this.processTickers2(tickers, timeframe, B_Channel, HT_Channel, delay);
  }

  private async processTickers2(
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

          if (!Array.isArray(data) || data.length < 2) {
            this.logger.warn(`⚠️ No valid data for ${ticker} (${timeframe})`);
            return;
          }
          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];

          console.log(`✅ Processing ${ticker} on ${timeframe} at ${lastData.date}`);
          // Process the data
          const OscConditionL = lastData.OSC > lastData.OSCSignal
          const OscConditionS = secondLastData.OSC > secondLastData.OSCSignal
          const OscCrossAb = OscConditionL && !OscConditionS
          const OscCrossBL = !OscConditionL && OscConditionS
          const macdCross = await this.stockHelperService.macdCross(
            lastData,
            secondLastData,
          );
          const signal =
            await this.stockHelperService.BuyOnly_StochRSICrossAB200(
              lastData,
              secondLastData,
            );
          const priceAbMA50 = lastData.close > lastData.MA50
          const priceAbMA100 = lastData.close > lastData.MA100 && priceAbMA50
          const priceAbMA200 = lastData.close > lastData.MA200 && priceAbMA100
          const priceAbMA300 = lastData.close > lastData.MA300
          const priceBlAl = lastData.close < lastData.MA50 && lastData.close < lastData.MA100 && lastData.close < lastData.MA200
          const MACDVALUEPOS = lastData.MACDLine > 0 || lastData.SignalLine >0 ? 'positive':'negative'
          if (!signal) return;
          const stockRSILAUP = lastData.StochRSI_K - lastData.StochRSI_D > 0;
          const stochRSICros = stockRSILAUP && (secondLastData.StochRSI_K - secondLastData.StochRSI_D <= 0) && secondLastData.StochRSI_K < 0.3;

          const lastDateOndata = lastData.date.split(' ')[0]
          if(macdCross.AB){
            await this.webhooksService.FireBaseApi("put", `stock-related/macdCross/${timeframe}/${lastDateOndata}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
          }else if(OscCrossAb){
            await this.webhooksService.FireBaseApi("put", `stock-related/OscCrossAb/${timeframe}/${lastDateOndata}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})

          }else if(stochRSICros){
            await this.webhooksService.FireBaseApi("put", `stock-related/stochRSICros/${timeframe}/${lastDateOndata}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
          }
          const webhookMap = [
            {
              condition:(macdCross.AB || OscCrossAb) &&  priceAbMA200,
              hook: `${OscCrossAb?this.stockHelperService.WEEKLY_SL.US_WK_OSC_200: this.stockHelperService.WEEKLY_SL.US_WK_MACDCR_200}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA200 ${MACDVALUEPOS}`
            },
            {
              condition:(macdCross.AB || OscCrossAb) &&  priceAbMA100 ,
              hook: `${OscCrossAb?this.stockHelperService.WEEKLY_SL.US_WK_OSC_100: this.stockHelperService.WEEKLY_SL.US_WK_MACDCR_100}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA100 ${MACDVALUEPOS}`
            },
            {
              condition:(macdCross.AB || OscCrossAb) && priceAbMA50 ,
              hook: `${OscCrossAb?this.stockHelperService.WEEKLY_SL.US_WK_OSC_50: this.stockHelperService.WEEKLY_SL.US_WK_MACDCR_50}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA50 ${MACDVALUEPOS}`
            },
            {
              condition: (macdCross.AB || OscCrossAb) && priceBlAl,
              hook: `${OscCrossAb?this.stockHelperService.WEEKLY_SL.US_WK_OSC_BL: this.stockHelperService.WEEKLY_SL.US_WK_MACDCR_BL}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceBlMA50_100_200 ${MACDVALUEPOS}`
            },
            {
              condition: stochRSICros,
              hook: this.stockHelperService.WEEKLY_SL.US_WK_STOCHRSI,
              msg:`*stochRSICros* --${priceAbMA200?'PriceCrMA200': priceAbMA100?'priceAbMA100': priceAbMA50?'priceAbMA50':'PriceBlAl'} -${MACDVALUEPOS}`
            },
          ];

          const matched = webhookMap.find((w) => w.condition);

          if (matched) {
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              data,
              DataSymbols.watchlist.includes(ticker)? this.stockHelperService.WEEKLY_SL.US_WK_WATCH :matched.hook,matched.msg,'500'
            );
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
}
