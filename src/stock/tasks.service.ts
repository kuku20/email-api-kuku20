import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { LocalPLWR } from './runlocal.service';
import axios from 'axios';
import { StockHelperService } from './stockHelper.service';
import * as Timer from './compareTime';
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  tickersAB = ['HE', 'UNH', 'INTC', 'XOM', 'AMZN', 'AAPL', 'SNAP', 'RDW', 'O'];
  uswtlists = ['NVDA', 'HE', 'UNH', 'INTC', 'XOM', 'AMZN', 'AAPL', 'SNAP'];
  testapikey = '2bbd0d305edb404aac2e2de5cc1311af'; // test
  allkeys = 'all'; // test
  wtchUsapikey = '2ff722044c8c4342938d5f10943dc754'; // alexangderwang@hotmail.com

  @Cron('*/5 14-21 * * 1-5')
  async runAllWatchLists() {
    // this.wakeupcall()
    const symbols = (await this.LocalPLWR.getDolist()) || [];
    await Promise.all([
      this.USTIMERUN(symbols, this.allkeys, 'US_EARLY_5MIN', 2, '5min'),
    ]);
  }

  @Cron('*/15 14-21 * * 1-5')
  async runAllWatL15min() {
    await this.sendDiscord(
      'WAKEUPCALL:15min',
      'RSIENDBOT 15min',
      'US',
      'CRON_CHECK',
    );
    const symbols = (await this.LocalPLWR.getDolist()) || [];
    await Promise.all([
      this.USTIMERUN(symbols, this.allkeys, 'US_EARLY_15MIN', 3, '15min'),
    ]);
  }

  @Cron('30 14-20 * * 1-5', { timeZone: 'UTC' })
  async runAllWatL1hour() {
    await this.sendDiscord(
      'WAKEUPCALL:1hour',
      'RWBOT 1hour',
      'US',
      'CRON_CHECK',
    );
    const symbols = (await this.LocalPLWR.getDolist()) || [];
    await Promise.all([
      this.USTIMERUN(symbols, this.allkeys, 'USSTOCK_WATCH', 4, '1hour'),
    ]);
  }
  async USTIMERUN(
    intickers: string[],
    api: any,
    channel,
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

    const tickers = intickers;
    await this.processTickers(tickers, timeframe, api, channel, delay);
  }

  private async processTickers(
    tickers: string[],
    timeframe: string,
    apikey: string,
    channel: string,
    delay = 2,
  ) {
    const date = new Date();
    // this.sendDiscord(`CHECKBOT ${category} ${timeframe} RUN AT: ${date}`, `RSIENDBOT ${category} ${timeframe}`, 'Nono', 'CRON_CHECK');

    const washselllists =
      (await this.LocalPLWR.loadWashSellList()) ||
      this.LocalPLWR.getWashSellList();
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));

    for (const ticker of tickers) {
      if (washselllists.includes(ticker)) {
        console.log(`⏭️ Skipping ${ticker} — in wash sell list`);
        continue; // ✅ Skip this ticker and move on
      }
      try {
        let data;
        if (apikey === 'all') {
          data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
        } else {
          data = await this.LocalPLWR.get12for(ticker, timeframe, apikey);
        }

        const lastData = data[data.length - 1];
        const secondLastData = data[data.length - 2];

        await this.compareAndSend(
          data,
          lastData,
          secondLastData,
          ticker,
          timeframe,
          channel,
        );
        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        this.sendDiscord(
          `ERROR ON API AT: ${timeframe} On ${date}`,
          `RSIENDBOT ${ticker} at ${timeframe}`,
          'Nono',
          'ERORR_CALL',
        );
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }

  async compareAndSend(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    channel,
  ) {
    // if (
    //   lastdata?.close < lastdata?.MA200 &&
    //   lastdata?.MA20 > lastdata?.MA50 &&
    //   Secondlastdata?.MA20 < Secondlastdata?.MA50 &&
    //   (lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine < Secondlastdata?.SignalLine
    //   || lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine > Secondlastdata?.SignalLine)
    // ) {
    //   await this.sendDiscord(`BUY EARLY ON-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}` , `${ticker} -ON- ${timeframe}`, lastdata,channel+'early_'+timeframe);
    // }
    const isWithinRange = Timer.checkIfWithin5MinutesEST(lastdata?.date);
    if (isWithinRange) {
      console.log(ticker, '✅ Within ±30 minutes of EST time');
    } else {
      console.log(
        ticker,
        '❌ Outside ±30 minutes of EST time: ',
        lastdata?.date,
      );
      return;
    }
    if (
      lastdata?.MACDLine > lastdata?.SignalLine &&
      Secondlastdata?.MACDLine < Secondlastdata?.SignalLine
    ) {
      if (timeframe === '5min') {
        // check on 15min to see bullish or bearish macd
        await this.run15Min5signal(ticker, lastdata, channel);
      } else {
        await this.sendDiscord(
          `BUY ON MACDCROSS-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
          `${ticker} -ON- ${timeframe}`,
          lastdata,
          channel,
        );
      }
    } else if (
      lastdata?.MACDLine < lastdata?.SignalLine &&
      Secondlastdata?.MACDLine > Secondlastdata?.SignalLine
    ) {
      await this.sendDiscord(
        `SELLLLLLLL ON-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker} -ON- ${timeframe}`,
        lastdata,
        'CRYPTO_WATCH',
      );
    }
    // if (
    //   lastdata?.close > lastdata?.MA200 &&
    //   Secondlastdata?.close < Secondlastdata?.MA200 &&
    //   (lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine < Secondlastdata?.SignalLine
    //   || lastdata?.MACDLine > lastdata?.SignalLine && Secondlastdata?.MACDLine > Secondlastdata?.SignalLine)
    // ) {
    //   await this.sendDiscord(`BUY now:check me-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}` , `${ticker} -ON- ${timeframe}`, lastdata,channel+'all');
    // }
    // else{
    //   // this.sendDiscord('BUY ERALLY', ticker, {}, 'ERORR_CALL');
    //   await this.sendDiscord(`TEST IF IT SENT-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}` , `${ticker} -ON- ${timeframe}`, lastdata,channel+'all');
    //   // console.log(lastdata)
    //   // console.log(Secondlastdata)
    //   // await this.sendDiscord(`BUY ERALLY ON-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}` , `${ticker} -ON- ${timeframe}`, lastdata,channel);
    // }
    const latest = await this.getLatest(data);
    await this.LocalPLWR.saveData(ticker, timeframe, latest.date, data);
  }

  async run15Min5signal(ticker, lastdata5min, channel) {
    this.logger.log(`${ticker} run15Min5signal.`);

    const data = await this.LocalPLWR.TwReveseNOAPI(ticker, '15min');

    const lastData = data[data.length - 1];
    if (lastData?.MACDLine > lastData?.SignalLine) {
      // 5min cross, 15 allway buy buy
      await this.sendDiscord(
        `ALL ABOVE SAFE BUY 5min (MACD:${lastdata5min?.MACDLine}): ${lastdata5min?.date}`,
        `${ticker} -ON- 5min`,
        lastdata5min,
        channel,
      );
    } else {
      await this.sendDiscord(
        `5MIN CROSS, BUT 15 RED!!!! (MACD:${lastdata5min?.MACDLine}): ${lastdata5min?.date}`,
        `${ticker} -ON- 5min`,
        lastdata5min,
        channel.includes('US') ? 'US_ALL' : 'CRYPTO_ALL',
      );
    }
  }
  async sendDiscord(
    message: string,
    ticker: string,
    lastdata: any,
    channel: string,
  ) {
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
      this.logger.log('⏱️ koyeb Keep-alive ping success:', data.status);
    } catch (err) {
      this.logger.error(`❌ Keep-alive failed: ${err.message}`);
      this.sendDiscord(
        `❌ koyeb Keep-alive failed:`,
        `RSIENDBOT BOTBOT`,
        'Nono',
        'ERORR_CALL',
      );
    }
  }

  async getLatest<T extends { date: string }>(data: T[]): Promise<T> {
    if (!data?.length) return null;
    return data.reduce((latest, current) =>
      new Date(current.date) > new Date(latest.date) ? current : latest,
    );
  }
}
