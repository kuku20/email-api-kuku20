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

  @Cron('*/3 * * * *')
  async wakeupcall() {
    try {
      const { data } = await axios.get('https://nestjs-api.koyeb.app');
      this.logger.log('⏱️ Keep-alive ping success:', data.status);
    } catch (err) {
      this.logger.error(`❌ Keep-alive failed: ${err.message}`);
    }
  }
  // Runs every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronCrypto() {
    this.logger.log('Running scheduled task for all tickers...');
    const date = new Date()
    const timefame = '5m'
    this.sendDiscord('CHECKBOT Crypto 5min RUN AT:'+date, 'RSIENDBOT 5MIN', 'Nono','CRON_CHECK');
    const tickers = ['BTC', 'BCH', 'LTC', 'ETH', 'DASH', 'ZEC', 'XMR'];
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
    this.logger.log('Running scheduled task for all tickers...');
    const date = new Date()
    this.sendDiscord('CHECKBOT Crypto 15MIN RUN AT:'+date, 'RSIENDBOT 15MIN', 'Nono','CRON_CHECK');
    const timefame = '15min'
    const tickers = ['BTCUSD','BCHUSD',"LTCUSD",'ETHUSD','DASHUSD','ZECUSD','XMRUSD'];
    // const tickers = ['BTCUSD']; // alanwork1234@hotmail.co
    const apikey = 'd3058ae5683b4fc19a787ceb21a87f67'
    await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000)); // 2-minute delay
    for (const ticker of tickers) {
      try {
        // Get historical data for the ticker
        const data = await this.LocalPLWR.get12for(ticker, timefame, apikey);
        const lastData = data[data.length-1];
        const secondLastData = data[data.length-2];
        // Compare and send alert if condition is met
        await this.compareAndSend(lastData, secondLastData, ticker, timefame, 'CRYPTO_WATCH');
        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        this.sendDiscord(`ERROR ON API AT: ${timefame} On ${date}`, `RSIENDBOT ${ticker}USD at ${timefame}`, 'Nono','ERORR_CALL');
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }

  async compareAndSend(lastdata, Secondlastdata, ticker, timefame, channel='BUYSELL') {
    if (
      lastdata?.close < lastdata?.MA200 &&
      lastdata?.MA20 > lastdata?.MA50 &&
      Secondlastdata?.MA20 < Secondlastdata?.MA50
    ) {
      this.sendDiscord(`BUY ERALLY ON-${timefame}: ${lastdata?.date}` , `${ticker} -ON- ${timefame}`, lastdata,channel);
    }
    // else{
    //   // this.sendDiscord('BUY ERALLY', ticker, {}, 'ERORR_CALL');
    //   console.log(lastdata)
    //   console.log(Secondlastdata)
    //   this.sendDiscord(`BUY ERALLY ON-${timefame}: ${lastdata?.date}` , `${ticker} -ON- ${timefame}`, lastdata,channel);
    // }
    if (
      lastdata?.close > lastdata?.MA200 &&
      Secondlastdata?.close < Secondlastdata?.MA200
    ) {
      this.sendDiscord(`BUY now:check me-${timefame}: ${lastdata?.date}`, `${ticker} -ON- ${timefame}`, lastdata,channel);
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
}
