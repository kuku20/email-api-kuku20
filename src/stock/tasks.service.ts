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

  // Runs every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronCrypto() {
    this.wakeupcall()
    this.logger.log('Running scheduled task for all tickers...');
    const date = new Date()
    const timefame = '5m'
    this.sendDiscord('CHECKBOT Crypto 5min RUN AT:'+date, 'RSIENDBOT 5MIN', 'Nono','CRON_CHECK');
    const tickers = ['BTC', 'BCH', 'LTC', 'ETH','ETC', 'DASH', 'ZEC', 'XMR'];
    // const tickers = ['BTC'];
    await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000)); // 2-minute delay
    for (const ticker of tickers) {
      try {
        // 1️⃣ Get historical data for the ticker
        const data = await this.LocalPLWR.getCoinHistory(ticker, timefame);

        const lastData = data[0];
        const secondLastData = data[1];

        // 4️⃣ Compare and send alert if condition is met
        await this.compareAndSend(lastData, secondLastData, ticker+'USD', timefame, 'CRYPTO_WATCH');

        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        this.sendDiscord(`ERROR ON API AT: ${timefame} On ${date}`, `RSIENDBOT ${ticker}USD at ${timefame}`, 'Nono','ERORR_CALL');
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
    await this.processTickers(tickers, '15min', apikey, 'CRYPTO_WATCH');
  }

  @Cron('*/5 14-21 * * 1-5') // 9:30 AM – 4:00 PM ET (14:30–21:00 UTC)
  async watchmeUStime() {
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    if (!this.stockHelperService.isMarketOpen()) {
      this.logger.log(`🕒 Market closed — skipping 5-min check (${now} ET)`);
      return;
    }
    this.logger.log(`✅ Market open — running 5-min trading logic (${now} ET)`);

    const tickers = ['NVDA', 'HE', 'UNH', 'INTC', 'XOM', 'AMZN', 'AAPL', 'SNAP'];
    const apikey = '2ff722044c8c4342938d5f10943dc754'; // alexangderwang@hotmail.com 
    // const apikey = '2bbd0d305edb404aac2e2de5cc1311af'; // test
    await this.processTickers(tickers, '5min', apikey, 'USSTOCK_WATCH');
  }


  private async processTickers(
    tickers: string[],
    timeframe: string,
    apikey: string,
    category: 'CRYPTO_WATCH' | 'USSTOCK_WATCH'
  ) {
    const date = new Date();
    this.sendDiscord(`CHECKBOT ${category} ${timeframe} RUN AT: ${date}`, `RSIENDBOT ${category} ${timeframe}`, 'Nono', 'CRON_CHECK');

    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000));

    for (const ticker of tickers) {
      try {
        const data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
        const lastData = data[data.length - 1];
        const secondLastData = data[data.length - 2];

        await this.compareAndSend(lastData, secondLastData, ticker, timeframe, category);
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

  async compareAndSend(lastdata, Secondlastdata, ticker, timefame, channel='BUYSELL') {
    if (
      lastdata?.close < lastdata?.MA200 &&
      lastdata?.MA20 > lastdata?.MA50 &&
      Secondlastdata?.MA20 < Secondlastdata?.MA50 &&
      (lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine < Secondlastdata?.SignalLine 
      || lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine > Secondlastdata?.SignalLine)
    ) {
      this.sendDiscord(`BUY EARLY ON-${timefame}(MACD:${lastdata?.MACDDivergence}): ${lastdata?.date}` , `${ticker} -ON- ${timefame}`, lastdata,channel);
    }

    if (
      lastdata?.MACDLine > lastdata?.SignalLine &&
      Secondlastdata?.MACDLine < Secondlastdata?.SignalLine
    ) {
      this.sendDiscord(`BUY ON MACDCROSS-${timefame}(MACD:${lastdata?.MACDDivergence}): ${lastdata?.date}` , `${ticker} -ON- ${timefame}`, lastdata,channel);
    }
    // else{
    //   // this.sendDiscord('BUY ERALLY', ticker, {}, 'ERORR_CALL');
    //   console.log(lastdata)
    //   console.log(Secondlastdata)
    //   // this.sendDiscord(`BUY ERALLY ON-${timefame}(MACD:${lastdata?.MACDDivergence}): ${lastdata?.date}` , `${ticker} -ON- ${timefame}`, lastdata,channel);
    // }
    if (
      lastdata?.close > lastdata?.MA200 &&
      Secondlastdata?.close < Secondlastdata?.MA200 &&
      (lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine < Secondlastdata?.SignalLine 
      || lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine > Secondlastdata?.SignalLine)
    ) {
      this.sendDiscord(`BUY now:check me-${timefame}(MACD:${lastdata?.MACDDivergence}): ${lastdata?.date}` , `${ticker} -ON- ${timefame}`, lastdata,channel);
    }
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
  
}
