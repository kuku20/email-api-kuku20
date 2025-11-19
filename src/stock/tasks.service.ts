import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { LocalPLWR } from './runlocal.service';
import axios from 'axios';
import { StockHelperService } from './stockHelper.service';
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  tickersAB = [
 'HE', 'UNH', 'INTC', 'XOM', 'AMZN', 'AAPL', 'SNAP','RDW', "O",
 "KMB",
 "CPRT",
 "DXCM",
 "BAX",
 "KNSL",
 "MUSA",
 "SOC",
 "APOG",
 "ARCT",
 "DJCO",
 "GIC",
 "CATX",
 "PTLO",
 "FLWS",
 "CRMT",
 "RMAX",
 "WEST",
 "NXDT",
 "HRTX",
 "OPAL",
 "ERIE",
 "MGNX",
 "ADSE",
 "AIFU",
 "DMLP",
 "RSVR",
 "ADM",
 "NTRA",
 "ROL",
 "LNT",
 "MP",
 "ADC",
 "ACLX",
 "INDV",
 "KAR",
 "MPW",
 "UPWK",
 "PAGS",
 "SBH",
 "STOK",
 "FIHL",
 "CPS",
 "XNCR",
 "OLMA",
 "VNDA",
 "HDB",
 "SA",
 "SIFY",
 "RNW",
 "ACRS",
 "CDZI",
 "STTK"
  ]

  tickersBL =[
    "O",
    "KMB",
    "CPRT",
    "DXCM",
    "BAX",
    "KNSL",
    "MUSA",
    "SOC",
    "APOG",
    "ARCT",
    "DJCO",
    "GIC",
    "CATX",
    "PTLO",
    "FLWS",
    "CRMT",
    "RMAX",
    "WEST",
    "NXDT",
    "HRTX",
    "OPAL",
    "ERIE",
    "MGNX",
    "ADSE",
    "AIFU",
    "DMLP",
    "RSVR"
  ]
  // Runs every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronCrypto() {
    this.wakeupcall()
    this.logger.log('Running scheduled task for all tickers...');
    const date = new Date()
    const timeframe = '5m'
    this.sendDiscord('CHECKBOT Crypto 5min RUN AT:'+date, 'RSIENDBOT 5MIN', 'Nono','CRON_CHECK');
    const tickers = ['BTC', 'BCH', 'LTC', 'ETH','ETC', 'DASH', 'ZEC', 'XMR'];
    // const tickers = ['BTC'];
    await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000)); // 2-minute delay
    for (const ticker of tickers) {
      try {
        // 1️⃣ Get historical data for the ticker
        const data = await this.LocalPLWR.getCoinHistory(ticker, timeframe);

        const lastData = data[0];
        const secondLastData = data[1];

        // 4️⃣ Compare and send alert if condition is met
        await this.compareAndSend(data, lastData, secondLastData, ticker+'USD', timeframe+'in', 'crypto_');

        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        this.sendDiscord(`ERROR ON API AT: ${timeframe} On ${date}`, `RSIENDBOT ${ticker}USD at ${timeframe}`, 'Nono','ERORR_CALL');
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }

  @Cron('*/15 * * * *') // every 15 minutes
  async handle15Min() {
    const tickers = ['BTCUSD', 'BCHUSD', 'LTCUSD', 'ETHUSD', 'ETCUSD', 'DASHUSD', 'ZECUSD', 'XMRUSD'];
    // const tickers = ['BTCUSD'];
    // const apikey = '2bbd0d305edb404aac2e2de5cc1311af'; // test
    const apikey = 'd3058ae5683b4fc19a787ceb21a87f67';
    this.logger.log('Running scheduled task for all tickers...');
    await this.processTickers(tickers, '15min', apikey, 'crypto_');
  }

  uswtlists = ['NVDA', 'HE', 'UNH', 'INTC', 'XOM', 'AMZN', 'AAPL', 'SNAP'];
  testapikey = '2bbd0d305edb404aac2e2de5cc1311af'; // test
  allkeys = 'all'; // test
  wtchUsapikey = '2ff722044c8c4342938d5f10943dc754'; // alexangderwang@hotmail.com 

  
  // // @Cron(CronExpression.EVERY_MINUTE)
  @Cron('*/5 14-21 * * 1-5')
  async runAllWatchLists() {
    await Promise.all([
      this.USTIMERUN(this.uswtlists, this.wtchUsapikey),
      this.USTIMERUN(this.tickersAB, this.allkeys),
      // this.USTIMERUN(this.tickersBL, this.allkeys),
    ]);
  }

  async USTIMERUN(intickers:any, api:any) {
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    if (!this.stockHelperService.isMarketOpen()) {
      this.logger.log(`🕒 Market closed — skipping 5-min check (${now} ET)`);
      return;
    }
    this.logger.log(`✅ Market open — running 5-min trading logic (${now} ET)`);

    const tickers = intickers;
    await this.processTickers(tickers, '5min', api, 'us_');
  }


  private async processTickers(
    tickers: string[],
    timeframe: string,
    apikey: string,
    category: 'crypto_' | 'us_'
  ) {
    const date = new Date();
    // this.sendDiscord(`CHECKBOT ${category} ${timeframe} RUN AT: ${date}`, `RSIENDBOT ${category} ${timeframe}`, 'Nono', 'CRON_CHECK');

    // Delay 2 minutes before processing
    // await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000));

    for (const ticker of tickers) {
      try {
        let data
        if(apikey === 'all'){
          data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
        }else{
          data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
        }
        
        const lastData = data[data.length - 1];
        const secondLastData = data[data.length - 2];

        await this.compareAndSend(data, lastData, secondLastData, ticker, timeframe, category);
        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        this.sendDiscord(
          `ERROR ON API AT: ${timeframe} On ${date}`,
          `RSIENDBOT ${ticker} at ${timeframe}`,
          'Nono',
          'ERORR_CALL'
        );
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }

  async compareAndSend(data, lastdata, Secondlastdata, ticker, timeframe, channel) {
    // if (
    //   lastdata?.close < lastdata?.MA200 &&
    //   lastdata?.MA20 > lastdata?.MA50 &&
    //   Secondlastdata?.MA20 < Secondlastdata?.MA50 &&
    //   (lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine < Secondlastdata?.SignalLine 
    //   || lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine > Secondlastdata?.SignalLine)
    // ) {
    //   await this.sendDiscord(`BUY EARLY ON-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}` , `${ticker} -ON- ${timeframe}`, lastdata,channel+'early_'+timeframe);
    // }

    if (
      lastdata?.MACDLine > lastdata?.SignalLine &&
      Secondlastdata?.MACDLine < Secondlastdata?.SignalLine
    ) {
      await this.sendDiscord(`BUY ON MACDCROSS-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}` , `${ticker} -ON- ${timeframe}`, lastdata,channel+'all');
    }
    // if (
    //   lastdata?.close > lastdata?.MA200 &&
    //   Secondlastdata?.close < Secondlastdata?.MA200 &&
    //   (lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine < Secondlastdata?.SignalLine 
    //   || lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine > Secondlastdata?.SignalLine)
    // ) {
    //   await this.sendDiscord(`BUY now:check me-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}` , `${ticker} -ON- ${timeframe}`, lastdata,channel+'all');
    // }
    else{
      // this.sendDiscord('BUY ERALLY', ticker, {}, 'ERORR_CALL');
      // await this.sendDiscord(`BUY now:check me-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}` , `${ticker} -ON- ${timeframe}`, lastdata,channel+'all');
      // console.log(lastdata)
      // console.log(Secondlastdata)
      // this.sendDiscord(`BUY ERALLY ON-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}` , `${ticker} -ON- ${timeframe}`, lastdata,channel);
    }
    const latest = await this.getLatest(data);
    await this.LocalPLWR.saveData(ticker, timeframe, latest.date, data);
  }

  async sendDiscord(message:string, ticker:string, lastdata:any, channel:string) {
    try {
      return await this.webhooksService.sendDiscordNotification(
        message,
        `${channel} ${ticker}`,
        JSON.stringify(lastdata),
      );
    } catch (err) {
      console.error('❌ Error in controller:', err);
      throw err;
    }
  }

  async wakeupcall() {
    try {
      const { data } = await axios.get('https://nestjs-api.koyeb.app');
      this.logger.log('⏱️ Keep-alive ping success:', data.status);
    } catch (err) {
      this.logger.error(`❌ Keep-alive failed: ${err.message}`);
      this.sendDiscord(
        `❌ Keep-alive failed:`,
        `RSIENDBOT BOTBOT`,
        'Nono',
        'ERORR_CALL'
      );
    }
  }

  async getLatest<T extends { date: string }>(data: T[]): Promise<T> {
    if (!data?.length) return null;
    return data.reduce((latest, current) =>
      new Date(current.date) > new Date(latest.date) ? current : latest
    );
  }  
}
