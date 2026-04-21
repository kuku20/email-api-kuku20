// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as StockSymbols from './dto/chartData';
import { stock_usall_symbols } from './dto/chartData';
import { stock_500_symbols } from './dto/chartData';
import pLimit from 'p-limit';
import { Cron, CronExpression } from '@nestjs/schedule';
@Injectable()
export class TestOndata_service {
  allkeys = 'all'; // test
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TestOndata_service.name);
  daytestBF = 0;
  dayend = this.stockHelperService.getDateNDaysAgo(-1 + this.daytestBF);
  endpointFolder = 'stock-price-check';
  timeframe = '1day';
  async onModuleInit() {
    // This runs ONCE when the app starts
    // const symbols =  await this.LocalPLWR.getArrSymbolFFire('${this.stockHelperService.aboveMA50api}/alldata/4hour') as string[];
    // await this.runAllWatchLists30(symbols);
    const endpon = '2026-04-08-15-00-00'
    // await this.runAllWatchLists30();
    const path = `${this.endpointFolder}/stock-related/${this.stockHelperService.aboveMA50api}/${endpon}/${this.timeframe}.json`;
     
    // const SLACK_WEBHOOKS_US50  = await this.LocalPLWR.FireBaseApi('get',`stock-related/${this.stockHelperService.aboveMA50api}/threeday/${this.timeframe}.json`,'')
    // const SLACK_WEBHOOKS_US50  = await this.LocalPLWR.FireBaseApi('get',`stock-related/${this.stockHelperService.aboveMA50api}/alldata/${this.timeframe}.json`,'')
    // const SLACK_WEBHOOKS_US50  = await this.LocalPLWR.FireBaseApi('get',`stock-related/${this.stockHelperService.aboveMA50api}/all3count/${this.timeframe}.json`,'')
    // const SLACK_WEBHOOKS_US50  = await this.LocalPLWR.FireBaseApi('get',`stock-related/${this.stockHelperService.aboveMA50api}/all3count-early/${this.timeframe}.json`,'')
    // const SLACK_WEBHOOKS_US50  = await this.LocalPLWR.FireBaseApi('get',`stock-related/${this.stockHelperService.aboveMA50api}/MACDDivergence/${this.timeframe}.json`,'')
    // const SLACK_WEBHOOKS_US50  = await this.LocalPLWR.FireBaseApi('get',`stock-related/${this.stockHelperService.aboveMA50api}/fourday/${this.timeframe}.json`,'')
    // const SLACK_WEBHOOKS_US50  = await this.LocalPLWR.FireBaseApi('get',`stock-related/${this.stockHelperService.aboveMA50api}/threeday/${this.timeframe}.json`,'')
    // const SLACK_WEBHOOKS_US50  = await this.LocalPLWR.FireBaseApi('get',`stock-related/${this.stockHelperService.aboveMA50api}/twoday/${this.timeframe}.json`,'')
    const SLACK_WEBHOOKS_US50  = await this.LocalPLWR.FireBaseApi('get',`stock-related/${this.stockHelperService.aboveMA50api}/oneday/${this.timeframe}.json`,'')

    // const data = await this.LocalPLWR.FireBaseApi('get','stock-related/post-wash-sell.json','')
    const tickers = Object.keys(SLACK_WEBHOOKS_US50);
    console.log(tickers);
    console.log(tickers.length);

    // this.stockHelperService.writeAbove2BillionToFile(tickers,'alldata-4hour-3-${this.stockHelperService.aboveMA50api}');
    // this.comparePrice(45, SLACK_WEBHOOKS_US50);
    // const SLACK_WEBHOOKS_US50 = await this.webhooksService.FireBaseApi(
    //   'get',
    //   path,
    //   '',
    // );
    // console.log('SLACK_WEBHOOKS_US50:', SLACK_WEBHOOKS_US50);
    // const SLACK_WEBHOOKS_US100 = await this.webhooksService.FireBaseApi(
    //   'get',
    //   path.replace('SLACK_WEBHOOKS_US50', 'SLACK_WEBHOOKS_US100'),
    //   '',
    // );
    // const SLACK_WEBHOOKS_US200 = await this.webhooksService.FireBaseApi(
    //   'get',
    //   path.replace('SLACK_WEBHOOKS_US50', 'SLACK_WEBHOOKS_US200'),
    //   '',
    // );

    // this.comparePrice(5, SLACK_WEBHOOKS_US100);
    // this.comparePrice(30, SLACK_WEBHOOKS_US200);
  }

  async USTIMERUN(
    intickers: string[],
    api: any,
    B_Channel,
    HT_Channel,
    delay,
    timeframe = '5min',
  ) {
    const tickers = intickers;
    await this.processTickers(
      tickers,
      timeframe,
      api,
      B_Channel,
      HT_Channel,
      delay,
    );
  }

  private async processTickers(
    tickers: string[],
    timeframe: string,
    apikey: string,
    B_Channel,
    HT_Channel,
    delay = 2,
  ) {
    const limit = pLimit(2); // Limit the concurrency to 8 at a time

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
          let data;
          if (apikey === 'all') {
            // data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
            data = await this.LocalPLWR.getTickerFullChart_POLYGON2(
              ticker,
              timeframe,
              this.daytestBF,
            );
          } else {
            data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
          }

          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];
          console.log(`Data for ${ticker}:`, lastData.date);
          // Process the data
          const signal =
            await this.stockHelperService.BuyOnly_StochRSICrossAB200(
              lastData,
              secondLastData,
            );
          if (!signal) return;

          const webhookMap = [
            { condition: signal.PriceCrMA50 && signal.ContinueUp, hook: 'SLACK_WEBHOOKS_US50' },
            { condition: signal.PriceCrMA100 && signal.ContinueUp, hook: 'SLACK_WEBHOOKS_US100' },
            { condition: signal.PriceCrMA200 && signal.ContinueUp, hook: 'SLACK_WEBHOOKS_US200' },
          ];

          const matched = webhookMap.find((w) => w.condition);
          const dateOut = lastData.date
          const timeput =dateOut.replace(/[: ]/g, '-');
          if (matched) {
            const data1 = await this.webhooksService.FireBaseApi(
              'put',
              `${this.endpointFolder}/${matched.hook}/${timeput}/${timeframe}/${ticker}.json`,
              lastData.close,
            );
          }
          this.logger.log(`${ticker} processed successfully.`);
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ON API AT: ${timeframe} On ${date}`,
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

  async runAllWatchLists30(symbols: string[] = stock_usall_symbols) {
    try {
      await this.USTIMERUN(
        symbols,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
        0,
        `${this.timeframe}`,
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
    }
  }

  async comparePrice(dayin, symbolsNprice: { [key: string]: number }) {
    try {
      await this.comparePriceRun(
        dayin,
        symbolsNprice,
        this.allkeys,
        'US_ALL',
        'USSTOCK_WATCH',
        0,
        `${this.timeframe}`,
      );
    } catch (error) {
      console.error('runAllWatchLists30 failed:', error);
      throw error;
    } finally {
    }
  }
  async comparePriceRun(
    dayin,
    symbolsNprice: any,
    apikey: any,
    B_Channel,
    HT_Channel,
    delay,
    timeframe = '5min',
  ) {
    const tickers = Object.keys(symbolsNprice);
    const tickerLength = tickers.length;
    let goUpCount = 0;
    let goDownCount = 0;
    console.log('Comparing prices for tickers:', tickerLength);
    const limit = pLimit(2); // Limit the concurrency to 8 at a time

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
        const tickerHolder = symbolsNprice[ticker];
        const tickerData = tickerHolder.lastData;
        const ticker2ndData = tickerHolder.secondLastData;
        const stockRSILAUP = tickerData.StochRSI_K - tickerData.StochRSI_D > 0;
        const stockRSIPRUP = ticker2ndData.StochRSI_K - ticker2ndData.StochRSI_D > 0;
        const compare2day = stockRSILAUP >= stockRSIPRUP;
        // const macdNeutral = tickerData.MACDLine > 0 && tickerData.MACDLine < 0.5; // Adjust the range as needed
        const rsiNeutral = tickerData.RSI > 40 && tickerData.RSI < 60; // Adjust the range as needed
        const macdNeutral =tickerData?.MACDDivergence 
        const isBadSetup =
        tickerData.StochRSI_K > 0.9 &&
        tickerData.StochRSI_D > 0.85 &&
        tickerData.RSI > 58 &&
        tickerData.divergence > 0.12 &&
        (tickerData.close - tickerData.MA10) / tickerData.MA10 > 0.01;
        const isBadSetup2 =
        tickerData.StochRSI_K > 0.9 &&
        tickerData.StochRSI_D > 0.8 &&
        tickerData.RSI > 60 &&
        tickerData.close > tickerData.MA5 &&
        tickerData.divergence > 0.1;
        // Go Up Percentage: 79.74683544303798% | Go Down Percentage: 20.253164556962027%
  if(isBadSetup2 || isBadSetup){
    return
  }
  if(!(stockRSILAUP)){
    return  this.logger.log(`⏭️ Skipping ${ticker} — MACD Divergence: ${tickerData.MACDDivergence}`);
  }
      //   if(!inrange2080 )    {     
      //      return 
      //     return this.logger.log(`⏭️ Skipping ${ticker} — MACD Divergence: ${tickerData.MACDDivergence}`);
      //   }
      //   if(!rsiNeutral )    {     
      //     return 
      //    return this.logger.log(`⏭️ Skipping ${ticker} — MACD Divergence: ${tickerData.MACDDivergence}`);
      //  }
        try {
          let data;
          if (apikey === 'all') {
            data = await this.LocalPLWR.getTickerFullChart_POLYGON2(
              ticker,
              timeframe,
              dayin
            );
            // data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
          } else {
            data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
          }

          const lastData = data[data.length - 1];
          const secondLastData = data[data.length - 2];

          const setDateValue = tickerData.high;
          const lastestPrice = lastData.low;
          console.log(`Data for ${ticker}:`, lastData.date);
          const linedetail = `volume(${tickerData.volume}) MA200(${tickerData.MA200}), MA100: ${tickerData.MA100}, MA50: ${tickerData.MA50} close: ${tickerData.close} vs ${lastestPrice} MACDDivergence: ${tickerData?.MACDDivergence} RSI: ${tickerData?.RSI} MACDLine: ${tickerData?.MACDLine}`;
          if (lastestPrice > setDateValue) {
            this.logger.log(
              linedetail
              // `${ticker} ${stock_500_symbols.includes(ticker)?'(Sp500)':''} go Up: ${
              //   lastestPrice > setDateValue
              // } | lastestPrice: ${lastestPrice} | Set Price: ${setDateValue}`,
            );
            goUpCount++;
          } else {
            // let data = await this.LocalPLWR.getMarketCap(ticker);
            // const mkb = data.market_cap / 1000000000; // Convert to billions
            // console.log(`Market Cap for ${ticker}: ${mkb.toFixed(2)} billion USD`);
            this.logger.error(linedetail
              // `${ticker} ${stock_500_symbols.includes(ticker)?'(Sp500)':''}  go Down: ${
              //   lastestPrice > setDateValue
              // } | lastestPrice: ${lastestPrice} | Set Price: ${setDateValue}`,
            );
            goDownCount++;
          }
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ON API AT: ${timeframe} On ${date}`,
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

    console.log(`Price comparison completed. Total tickers: ${tickerLength}`);
    console.log(`Go Up: ${goUpCount} | Go Down: ${goDownCount}`); 
    console.log(`Go Up Percentage: ${(goUpCount / (goUpCount+goDownCount)) * 100}% | Go Down Percentage: ${(goDownCount / (goDownCount+goUpCount)) * 100}%`);
  }
}
