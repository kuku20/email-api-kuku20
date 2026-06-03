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
export class TasksUS_ALL_MK_MASS_MACD_OSC {
  allkeys = 'all'; // test
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksUS_ALL_MK_MASS_MACD_OSC.name);
  today = this.stockHelperService.getDateNDaysAgo(0);
  dayago = 0// end of toi 4
  rundayaogo = this.stockHelperService.getDateNDaysAgo(this.dayago);
  marketTarget = 2
  async onModuleInit() {
    const symbols = await this.LocalPLWR.getholdingList()
    const combine4h = [...symbols, ...DataSymbols.watchlist]
    const uniqueCombine4h = Array.from(new Set(combine4h));
    console.log('Combined watchlist and holdings:', uniqueCombine4h.length, 'symbols');
    // console.log('TasksUS_ALL_MK_MASS_MACD_OSC initialized', DataSymbols.watchlist.length);
    // const timeframe = '1day/2026-05-28'
    // const geminibuy  = await this.LocalPLWR.FireBaseApi('get',`stock-gemini-buy/${timeframe}.json`,'')
    // console.log('geminibuy', Object.keys(geminibuy)) 
    // await this.runOnlyDaily4hour(symbols)
    // await this.runWatchlistGemini(symbols);
    // await this.runevery4hour()
    // await this.runWatchlistGemini(symbols, this.stockHelperService.US_DAILY_, '1day');
    // await this.runAllOn1day(['IVZ']);
    // await this.runfullonms(['ABBV','ACN','MSFT']);
    // await this.runAllWatchLists(Object.keys(geminibuy));
    // await this.runAllOn1day([
    //   'NVDA',
    // ]);
    // await this.runOnly4hxx(DataSymbols.stock_500_symbols)
    // await this.runAllOn4h(DataSymbols.stock_500_symbols);
    // const data =  await this.LocalPLWR.getTickerFullChart_POLYGON2(
    //   "TSLA",
    //   '1week',this.dayago
    // );
    // console.log(data.slice(-1), data.length)
    // let  data2 = await this.LocalPLWR.TwReveseNOAPI("TSLA",'1week');
    // console.log(data2.slice(-1), data2.length)
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
          // let  data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
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
          // console.log(`Signal for ${ticker} on ${timeframe}:`, signal);
          const MACDPositive = lastData.divergence > 0;
          const sp500 = DataSymbols.stock_500_symbols.includes(ticker) ? '(SP500)-' : ''
          if (timeframe === '1day') {
          if(signal && signal.RSI15up){
            await this.webhooksService.FireBaseApi("put", `stock-related/RSI/RSI15AL/${timeframe}/${this.today}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
            await this.webhooksService.sendDiscord(
              `${sp500}SBUY-RSI15AL-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}`,
              lastData,
              'RSI15AL',
              data,
            );
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              this.stockHelperService.US_DAILY_.RSI_15,'RSIBL15','500'
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
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              this.stockHelperService.US_DAILY_.RSI_20,'RSI15-20','500'
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
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              this.stockHelperService.US_DAILY_.RSI_25,'RSI20-25','500'
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
          }
          if (
            !(DataSymbols.stock_500_symbols.includes(ticker) ||
            DataSymbols.watchlist.includes(ticker))
          ) {
            return;
          }
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
              hook: timeframe === '1day'?`${OscCrossAb?this.stockHelperService.US_DAILY_.OSC_200: this.stockHelperService.US_DAILY_.MACDCR_200}`: `${OscCrossAb?this.stockHelperService.US_4H_.OSC_200: this.stockHelperService.US_4H_.MACDCR_200}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA200 ${MACDVALUEPOS}`
            },
            {
              condition:(macdCross.AB || OscCrossAb) &&  priceAbMA100 ,
              hook: timeframe === '1day'?`${OscCrossAb?this.stockHelperService.US_DAILY_.OSC_100:  this.stockHelperService.US_DAILY_.MACDCR_100}`: `${OscCrossAb?this.stockHelperService.US_4H_.OSC_100: this.stockHelperService.US_4H_.MACDCR_100}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA100 ${MACDVALUEPOS}`
            },
            {
              condition:(macdCross.AB || OscCrossAb) && priceAbMA50 ,
              hook: timeframe === '1day'?`${OscCrossAb?this.stockHelperService.US_DAILY_.OSC_50: this.stockHelperService.US_DAILY_.MACDCR_50}`: `${OscCrossAb?this.stockHelperService.US_4H_.OSC_50: this.stockHelperService.US_4H_.MACDCR_50}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA50 ${MACDVALUEPOS}`
            },
            {
              condition: (macdCross.AB || OscCrossAb) && priceBlAl,
              hook: timeframe === '1day'?`${OscCrossAb?this.stockHelperService.US_DAILY_.OSC_BL:  this.stockHelperService.US_DAILY_.MACDCR_BL}`: `${OscCrossAb?this.stockHelperService.US_4H_.OSC_BL: this.stockHelperService.US_4H_.MACDCR_BL}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceBlMA50_100_200 ${MACDVALUEPOS}`
            },
            {
              condition: stochRSICros,
              hook: timeframe === '1day'?this.stockHelperService.US_DAILY_.STOCHRSI:this.stockHelperService.US_4H_.STOCHRSI,
              msg:`*stochRSICros* --${priceAbMA200?'PriceCrMA200': priceAbMA100?'priceAbMA100': priceAbMA50?'priceAbMA50':'PriceBlAl'} -${MACDVALUEPOS}`
            },
          ];

          const matched = webhookMap.find((w) => w.condition);
          const wlSl = timeframe === '1day'? this.stockHelperService.US_DAILY_.WATCH : this.stockHelperService.US_4H_.WATCH;
          if (matched) {
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              data,
              DataSymbols.watchlist.includes(ticker)? wlSl : matched.hook,matched.msg,'500'
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

  @Cron('0 0 * * 1-5', {
    timeZone: 'America/Los_Angeles',
  })
  async runfullonms(stocklist = DataSymbols.above2billion){
    // delete old data from firebase
    const today = this.stockHelperService.getDateNDaysAgo(0); // Get today's date
    await this.webhooksService.deleteFirebase(this.stockHelperService.aboveMA50api); // reset firebase data for the day
    await this.webhooksService.deleteFirebase(this.stockHelperService.aboveMA50api+'-aboveMA200'); // reset firebase data for the day
    await this.webhooksService.deleteFirebase('runOn4hourInday'); // reset firebase data for the day
    this.stockHelperService.ListMA50On1day = []; // Clear the list at the start of each run
    // await this.webhooksService.SendDcChannels(['EARLY_AB200', '200AB_LESS_01', 'RSI15AL', 'RSIALERT','RSI25AL', 'RSI30AL','200AB_LESS_05','MA_AB_5_20'],this.logger,'1day');
    await this.webhooksService.SendDcChannels(['RSI15AL', 'RSIALERT','RSI25AL', 'RSI30AL',],this.logger,'1day');
    await this.webhooksService.sendSlackNotification(
      `START+${today}+START=1day=(aboveMA50Count >= 3 && MACDPositive)==`,
      '1day',
    );

    const combine = [...stocklist, ...DataSymbols.watchlist]
    const uniqueCombine = Array.from(new Set(combine));
    await this.runAllWatchLists(uniqueCombine);

    // await this.webhooksService.SendDcChannels(['EARLY_AB200', '200AB_LESS_01', 'RSI15AL', 'RSIALERT','RSI25AL', 'RSI30AL','200AB_LESS_05','MA_AB_5_20'],this.logger, '1day');
    await this.webhooksService.SendDcChannels([ 'RSI15AL', 'RSIALERT','RSI25AL', 'RSI30AL'],this.logger, '1day');
    await this.webhooksService.sendSlackNotification(
      `END+${today}+END=1day=(aboveMA50Count >= 3 && MACDPositive)===`,
      '1day',
    );
    const combine4h = [...DataSymbols.stock_500_symbols, ...DataSymbols.watchlist]
    const uniqueCombine4h = Array.from(new Set(combine4h));
    await this.runOnly4hxx(uniqueCombine4h)
  }
  async runOnly4hxx(stocklist) {

    const webhooks = [...Object.values(this.stockHelperService.US_4H_)]
    
    await this.stockHelperService.sendBatchNotification('START','4hour',webhooks,this.webhooksService,1000,);
    await this.runOnly4h(stocklist);
    await this.stockHelperService.sendBatchNotification('START','4hour',webhooks,this.webhooksService,1000,);
  }

  async runAllWatchLists(stocklist) {

    const webhooks = [...Object.values(this.stockHelperService.US_DAILY_),...Object.values(this.stockHelperService.AI_SL)];

    await this.stockHelperService.sendBatchNotification('START','1day',webhooks,this.webhooksService,1000,);
    await this.runAllOn1day(stocklist);
    await this.stockHelperService.sendBatchNotification('END','1day',webhooks,this.webhooksService,1000,);
    // await this.webhooksService.sendlast('EARLY_AB200', '200AB_LESS_01');
  }

  async runAllOn1day(stocklist) {
    // await this.webhooksService.deleteFirebase('macdCross_AB/upYet/1day','stockRSILAUP');
    // await this.webhooksService.deleteFirebase('macdCross_AB/OscConditionL/1day','stockRSILAUP');
    // await this.webhooksService.deleteFirebase('macdCross_AB','stockRSILAUP/upYet');
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
  async runOnly4h(stocklist) {
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
  async runAllOn4h(stocklist) {
    await this.webhooksService.deleteFirebase('NextRound/4hour','stockRSILAUP');
    const tslaDc = `<https://discord.com/channels/1306113720979689523/1380037316143349922|4HOUR_RUN_LOOK_TSLA_DC>`
    const smciDc = `<https://discord.com/channels/1306113720979689523/1348653615992143924|4HOUR_RUN_LOOK_SMCI_DC>`
    const macd4huorDc = `<https://discord.com/channels/1306113720979689523/1436948457247080589|4HOUR_RUN_LOOK_MACDCRAB_DC>`
    const message_tsla = `${tslaDc}${'='.repeat(32)}`;
    const message_smci = `${smciDc}${'='.repeat(32)}`;
    this.webhooksService.sendSlackNotification('START_'+message_tsla, this.stockHelperService.Z_US_SL.Z_US_SL_4h_3C_AB);
    this.webhooksService.sendSlackNotification('START_'+message_smci, this.stockHelperService.Z_US_SL.Z_US_SL_4h_3C_BL);
    this.webhooksService.sendSlackNotification('START_'+macd4huorDc, this.stockHelperService.US_4H_.MACDCR_BL);
    const slma50 = `**[LOOK_US30ABMA50_SL](https://myworkspace.slack.com/archives/${this.stockHelperService.Z_US_SL.Z_US_SL_4h_3C_AB})**`
    const slma100 = `**[LOOK_US30ABMA100_SL](https://myworkspace.slack.com/archives/${this.stockHelperService.Z_US_SL.Z_US_SL_4h_3C_BL})**`
    const slmacd = `**[LOOK_US30ABMA100_SL](https://myworkspace.slack.com/archives/${this.stockHelperService.US_4H_.MACDCR_BL})**`
    await this.webhooksService.SendDcChannels(['TSLA'],this.logger,`START_4OUR_${slma50}`);
    await this.webhooksService.SendDcChannels(['SMCI'],this.logger,`START_4OUR_${slma100}`);
    await this.webhooksService.SendDcChannels(['MA_AB_5_200'],this.logger,`START_4OUR_${slmacd}`);
    await this.runOnly4h(stocklist);
    await this.webhooksService.sendlast('200BL_OV_NEG_01', '200BL_OV_NEG_05');
    this.webhooksService.sendSlackNotification('END_'+message_tsla, this.stockHelperService.Z_US_SL.Z_US_SL_4h_3C_AB);
    this.webhooksService.sendSlackNotification('END_'+message_smci, this.stockHelperService.Z_US_SL.Z_US_SL_4h_3C_BL);
    this.webhooksService.sendSlackNotification('END_'+macd4huorDc, this.stockHelperService.US_4H_.MACDCR_BL);
    await this.webhooksService.SendDcChannels(['TSLA'],this.logger,`END_4HOUR_${slma50}`);
    await this.webhooksService.SendDcChannels(['SMCI'],this.logger,`END_4OUR_${slma100}`);
    await this.webhooksService.SendDcChannels(['MA_AB_5_200'],this.logger,`END_4HOUR_${slmacd}`);
  }

  //@Cron('45 9,13 * * 1-5', { timeZone: 'America/New_York' }) // Every day at 9:45 AM and 1:45 1 PM ET on weekdays
  async runOnlyDaily4hour(stocklist = DataSymbols.stock_500_symbols) {
    const combine = [...stocklist, ...DataSymbols.watchlist]
    const uniqueCombine = Array.from(new Set(combine));
    const webhooks = [...Object.values(this.stockHelperService.US_4H_)]

    await this.stockHelperService.sendBatchNotification('START','4hour',webhooks,this.webhooksService,1000,);
    await this.runOnlyDaily4hours(uniqueCombine);
    await this.stockHelperService.sendBatchNotification('END','4hour',webhooks,this.webhooksService,1000,);
  }

  async runOnlyDaily4hours(stocklist) {
    await Promise.all([
      this.USTIMERUN2(
        stocklist,
        '200BL_OV_NEG_01',
        '200BL_OV_NEG_05',
        0,
        '4hour',
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
              hook: `${OscCrossAb?this.stockHelperService.US_4H_.OSC_200: this.stockHelperService.US_4H_.MACDCR_200}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA200 ${MACDVALUEPOS}`
            },
            {
              condition:(macdCross.AB || OscCrossAb) &&  priceAbMA100 ,
              hook: `${OscCrossAb?this.stockHelperService.US_4H_.OSC_100: this.stockHelperService.US_4H_.MACDCR_100}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA100 ${MACDVALUEPOS}`
            },
            {
              condition:(macdCross.AB || OscCrossAb) && priceAbMA50 ,
              hook: `${OscCrossAb?this.stockHelperService.US_4H_.OSC_50: this.stockHelperService.US_4H_.MACDCR_50}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA50 ${MACDVALUEPOS}`
            },
            {
              condition: (macdCross.AB || OscCrossAb) && priceBlAl,
              hook: `${OscCrossAb?this.stockHelperService.US_4H_.OSC_BL: this.stockHelperService.US_4H_.MACDCR_BL}`,
              msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceBlMA50_100_200 ${MACDVALUEPOS}`
            },
            {
              condition: stochRSICros,
              hook: this.stockHelperService.US_4H_.STOCHRSI,
              msg:`*stochRSICros* --${priceAbMA200?'PriceCrMA200': priceAbMA100?'priceAbMA100': priceAbMA50?'priceAbMA50':'PriceBlAl'} -${MACDVALUEPOS}`
            },
          ];

          const matched = webhookMap.find((w) => w.condition);

          if (matched) {
            await this.webhooksService.sendSlackNotificationVN(timeframe,
              [ticker],
              lastData,
              DataSymbols.watchlist.includes(ticker)? this.stockHelperService.US_4H_.WATCH :matched.hook,matched.msg,'500'
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

    // Wait for all ticker promises to complete concurrentl  y (with concurrency limit)
    await Promise.all(tickerPromises);
  }

  @Cron('45 9,13 * * 1-5', { timeZone: 'America/New_York' }) // Every day at 9:45 AM and 1:45 1 PM ET on weekdays
  async runevery4hour(stocklist = DataSymbols.stock_500_symbols) {
    const symbols = await this.LocalPLWR.getholdingList()
    const combine = [...stocklist, ...DataSymbols.watchlist,...symbols]
    const uniqueCombine = Array.from(new Set(combine));
    await this.runWatchlistGemini(uniqueCombine)
  }

  @Cron('0 17 * * 1-5', { timeZone: 'America/New_York' }) // Every weekday at 5:00 PM New York time
  async runeverydayat4pm(stocklist = DataSymbols.stock_500_symbols) {
    const symbols = await this.LocalPLWR.getholdingList()
    const combine = [...stocklist, ...DataSymbols.watchlist,...symbols]
    const uniqueCombine = Array.from(new Set(combine));
    await this.runWatchlistGemini(uniqueCombine, this.stockHelperService.US_DAILY_, '1day')
  }

  async runWatchlistGemini(stocklist, slChannel = this.stockHelperService.US_4H_, timeframe = '4hour') {
    const webhooks = [
      ...Object.keys(slChannel),
      ...Object.values(this.stockHelperService.AI_SL),
    ];
    await this.stockHelperService.sendBatchNotification('START',timeframe,webhooks,this.webhooksService,1000,);
    await Promise.all([
      this.processTickers_runWatchlistGemini(
        stocklist,
        timeframe, slChannel,
        0,
      ),
    ]);
    await this.stockHelperService.sendBatchNotification('END',timeframe,webhooks,this.webhooksService,1000,);
  }

  private async processTickers_runWatchlistGemini(
    tickers: string[],
    timeframe: string,
    slChannel=this.stockHelperService.US_4H_,
    delay = 2,
  ) {
    const symbols = await this.LocalPLWR.getholdingList()
    const WatchListNholding = [...symbols, ...DataSymbols.watchlist]
    const ONMIRUNNOW = Array.from(new Set(WatchListNholding));
    console.log('ONMIRUNNOW:', ONMIRUNNOW.length);
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

          const MACDPositive = lastData.divergence > 0;
          const sp500 = DataSymbols.stock_500_symbols.includes(ticker) ? '(SP500)-' : ''
          const signal =
          await this.stockHelperService.BuyOnly_StochRSICrossAB200(
            lastData,
            secondLastData,
          );
          if (timeframe === '1day') {
            if(signal && signal.RSI15up){
              await this.webhooksService.FireBaseApi("put", `stock-related/RSI/RSI15AL/${timeframe}/${this.today}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
              await this.webhooksService.sendDiscord(
                `${sp500}SBUY-RSI15AL-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
                `${ticker}-ON-${timeframe}`,
                lastData,
                'RSI15AL',
                data,
              );
              await this.webhooksService.sendSlackNotificationVN(timeframe,
                [ticker],
                lastData,
                this.stockHelperService.US_DAILY_.RSI_15,'RSIBL15','500'
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
              await this.webhooksService.sendSlackNotificationVN(timeframe,
                [ticker],
                lastData,
                this.stockHelperService.US_DAILY_.RSI_20,'RSI15-20','500'
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
              await this.webhooksService.sendSlackNotificationVN(timeframe,
                [ticker],
                lastData,
                this.stockHelperService.US_DAILY_.RSI_25,'RSI20-25','500'
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
          }
          if (!(DataSymbols.stock_500_symbols.includes(ticker) ||DataSymbols.watchlist.includes(ticker))) {
            return;
          }

          const OscConditionL = lastData.OSC > lastData.OSCSignal
          const OscConditionS = secondLastData.OSC > secondLastData.OSCSignal
          const OscCrossAb = OscConditionL && !OscConditionS
          const macdCross = await this.stockHelperService.macdCross(
            lastData,
            secondLastData,
          );
          const priceAbMA50 = lastData.close > lastData.MA50
          const priceAbMA100 = lastData.close > lastData.MA100 && priceAbMA50
          const priceAbMA200 = lastData.close > lastData.MA200 && priceAbMA100
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

          if(ONMIRUNNOW.includes(ticker)){ // if stock in watchlist or holding list then call gemini to get recommendation and post to slack with thread link from gemini response
            const {RecommendThreadLink,getResFromGemini} = await this.webhooksService.GetGeminiReNPosted(timeframe,ticker,data);
            if(this.stockHelperService.HoldingList.includes(ticker)){
              const {msg,postToCSLRE} = await this.webhooksService.sendSlackNotificationVN(timeframe,
                [ticker],
                lastData,
                this.stockHelperService.Z_US_SL.Z_US_SL_HOLDING,'AI-detail','500'
              );
              await this.webhooksService.reply_SLack(
                postToCSLRE.channel,
                postToCSLRE.ts,
                RecommendThreadLink
              );
            }
            else if(getResFromGemini.toLowerCase().includes('buy')){
             const {msg,postToCSLRE} = await this.webhooksService.sendSlackNotificationVN(timeframe,
                [ticker],
                lastData,
                slChannel.WATCH ,'AI-BUY','500'
              );
              await this.webhooksService.reply_SLack(
                postToCSLRE.channel,
                postToCSLRE.ts,
                RecommendThreadLink
              );
              const lastDateOndata = lastData.date.split(' ')[0]
              await this.LocalPLWR.FireBaseApi("put", `stock-gemini-buy/${timeframe}/${lastDateOndata}/${ticker}.json`, {lastData: lastData})
            } else {

              const webhookMap = [
                {
                  condition:(macdCross.AB || OscCrossAb) &&  priceAbMA200,
                  hook: `${OscCrossAb?slChannel.OSC_200: slChannel.MACDCR_200}`,
                  msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA200 ${MACDVALUEPOS}`
                },
                {
                  condition:(macdCross.AB || OscCrossAb) &&  priceAbMA100 ,
                  hook: `${OscCrossAb?slChannel.OSC_100: slChannel.MACDCR_100}`,
                  msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA100 ${MACDVALUEPOS}`
                },
                {
                  condition:(macdCross.AB || OscCrossAb) && priceAbMA50 ,
                  hook: `${OscCrossAb?slChannel.OSC_50: slChannel.MACDCR_50}`,
                  msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA50 ${MACDVALUEPOS}`
                },
                {
                  condition: (macdCross.AB || OscCrossAb) && priceBlAl,
                  hook: `${OscCrossAb?slChannel.OSC_BL: slChannel.MACDCR_BL}`,
                  msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceBlMA50_100_200 ${MACDVALUEPOS}`
                },
                {
                  condition: stochRSICros,
                  hook: slChannel.STOCHRSI,
                  msg:`*stochRSICros* --${priceAbMA200?'PriceCrMA200': priceAbMA100?'priceAbMA100': priceAbMA50?'priceAbMA50':'PriceBlAl'} -${MACDVALUEPOS}`
                },
              ];
    
              const matched = webhookMap.find((w) => w.condition);
    
              if (matched) {
                const {msg,postToCSLRE} = await this.webhooksService.sendSlackNotificationVN(timeframe,
                  [ticker],
                  lastData,
                  DataSymbols.watchlist.includes(ticker)? slChannel.WATCH :matched.hook,matched.msg,'500'
                );
                await this.webhooksService.reply_SLack(
                  postToCSLRE.channel,
                  postToCSLRE.ts,
                  RecommendThreadLink
                );
              }
            }
          }
          else { // run other stock with send fulldata to get gemini for meet contion and call gemini and posted.

            const webhookMap = [
              {
                condition:(macdCross.AB || OscCrossAb) &&  priceAbMA200,
                hook: `${OscCrossAb?slChannel.OSC_200: slChannel.MACDCR_200}`,
                msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA200 ${MACDVALUEPOS}`
              },
              {
                condition:(macdCross.AB || OscCrossAb) &&  priceAbMA100 ,
                hook: `${OscCrossAb?slChannel.OSC_100: slChannel.MACDCR_100}`,
                msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA100 ${MACDVALUEPOS}`
              },
              {
                condition:(macdCross.AB || OscCrossAb) && priceAbMA50 ,
                hook: `${OscCrossAb?slChannel.OSC_50: slChannel.MACDCR_50}`,
                msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceCrMA50 ${MACDVALUEPOS}`
              },
              {
                condition: (macdCross.AB || OscCrossAb) && priceBlAl,
                hook: `${OscCrossAb?slChannel.OSC_BL: slChannel.MACDCR_BL}`,
                msg:`*${macdCross.AB_BL0?'macdCross_AB_BL0':macdCross.AB?'macdCross_AB':''}${OscCrossAb?'OscCrossAb :'+lastData.OSC:''}* - PriceBlMA50_100_200 ${MACDVALUEPOS}`
              },
              {
                condition: stochRSICros,
                hook: slChannel.STOCHRSI,
                msg:`*stochRSICros* --${priceAbMA200?'PriceCrMA200': priceAbMA100?'priceAbMA100': priceAbMA50?'priceAbMA50':'PriceBlAl'} -${MACDVALUEPOS}`
              },
            ];
  
            const matched = webhookMap.find((w) => w.condition);
            if (matched) {
              await this.webhooksService.sendSlackNotificationVN(timeframe,
                [ticker],
                data,
                DataSymbols.watchlist.includes(ticker)? slChannel.WATCH :matched.hook,matched.msg,'500'
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
}
