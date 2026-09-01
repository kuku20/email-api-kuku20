// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';

@Injectable()
export class TaskCryptoService {
  constructor(
    private readonly stockHelperService: StockHelperService,
    private readonly webhooksService: WebhooksService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TaskCryptoService.name);

  private async processTickers1hour(
    tickers: string[],
    timeframe: string,
    apikey: string,
    B_Channel,
    HT_Channel,
    delay = 5,
  ) {
    const date = new Date();
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

        await this.webhooksService.compareAndSend1hour(
          data,
          lastData,
          secondLastData,
          ticker,
          timeframe,
          B_Channel,
          HT_Channel,
        );
        // const isWithinRange = this.webhooksService.checktimeMinutesEST(
        //   ticker,
        //   lastData?.date,
        //   13,
        // );
        // if (isWithinRange) {
        //   await this.webhooksService.runCrOn_MA50(
        //     data,
        //     ticker,
        //     timeframe,
        //     HT_Channel,
        //     B_Channel,
        //   );
        // }
        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        this.webhooksService.sendDiscord(
          `ERROR ON API AT: ${timeframe} On ${date}: ${JSON.stringify(error)}`,
          `RSIENDBOT ${ticker} at ${timeframe}`,
          'Nono',
          'ERORR_CALL',
        );
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }

  private async processTickers15m(
    tickers: string[],
    timeframe: string,
    apikey: string,
    B_Channel,
    HT_Channel,
    delay = 5,
  ) {
    const date = new Date();
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

        const isWithinRange = this.webhooksService.checktimeMinutesEST(
          ticker,
          lastData?.date,
          13,
        );
        if (isWithinRange) {
          const BuyOnly_StochRSICrossAB200 =
            await this.stockHelperService.BuyOnly_StochRSICrossAB200(
              lastData,
              secondLastData,
            );
          if (BuyOnly_StochRSICrossAB200.PriceCrMA200) {
            await this.webhooksService.sendDiscord(
              `SBUY-BuyOnly_StochRSICrossAB200-PriceCrMA200 -${timeframe}-${lastData?.close}-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}-${lastData?.close}`,
              lastData,
              HT_Channel,
              data,
            );
            return;
          }
        }
        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        this.webhooksService.sendDiscord(
          `ERROR ON API AT: ${timeframe} On ${date}: ${JSON.stringify(error)}`,
          `RSIENDBOT ${ticker} at ${timeframe}`,
          'Nono',
          'ERORR_CALL',
        );
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }

  tickers_group1 = [
    'BTCUSD',
    'LTCUSD',
    'ETHUSD',
    'ETCUSD',
    'PAXGUSD',
    // 'DASHUSD',
    // 'ZECUSD',
    // 'XMRUSD',
    // 'BCHUSD',

    // 'SOLUSD',
    // 'XRPUSD',
    // 'BNBUSD',
    // 'LINKUSD',
    // 'SUIUSD',
    // 'TONUSD',
    // 'UNIUSD',
    // 'AAVEUSD',
    // 'COMPUSD',
    // 'AVAXUSD',
  ];
  tickers_group2 = ['SOLUSD', 'ADAUSD', 'XRPUSD', 'BNBUSD', 'LINKUSD'];
  tickers_group3 = [
    'SUIUSD',
    'TONUSD',
    'UNIUSD',
    'AAVEUSD',
    'COMPUSD',
    'AVAXUSD',
  ];
  private readonly cryptoChannels = {
    '1day': {
      buyChannel: 'CRYPTO_WATCH',
      htChannel: 'CRYPTO_ALL',
    },
    '4h': {
      buyChannel: 'CR_4H_BUY',
      htChannel: 'CR_4H_HT',
    },
    '1h': {
      buyChannel: 'CR_1H_BUY',
      htChannel: 'CR_1H_HT',
    },
    '30min': {
      buyChannel: 'CR_30M_BUY',
      htChannel: 'CR_30MIN_HT',
    },
    '15min': {
      buyChannel: 'CRYPTO_EARLY_5MIN',
      htChannel: 'CR_5M_HT',
    },
  } as const;

  async handleCryptoChannel(
    timeWait: number,
    tickers: string[],
    apiKey: string,
    timeframe: keyof typeof this.cryptoChannels,
  ): Promise<void> {
    const { buyChannel, htChannel } = this.cryptoChannels[timeframe];

    this.logger.log(`Running ${timeframe} for CRYPTOs...`, tickers);

    await this.processTickers1hour(
      tickers,
      timeframe,
      apiKey,
      buyChannel,
      htChannel,
      timeWait,
    );
  }

  @Cron('*/15 * * * *') // every 15 minutes
  async handle5pCrypto(time_wait = 2, tickers = this.tickers_group1) {
    this.logger.log('Running scheduled every 15min for CRYPTOs...');
    await this.processTickers15m(
      tickers,
      '15min',
      'all',
      'CRYPTO_EARLY_5MIN',
      'CR_5M_HT',
      time_wait,
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handle30pCrypto(
    time_wait = 3,
    tickers = this.tickers_group1,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    //liamsterling1@outlook.com)
    await this.handleCryptoChannel(time_wait, tickers, apikey, '30min');
  }

  // @Cron(CronExpression.EVERY_30_MINUTES)
  async handle30minCrypto1(
    time_wait = 3,
    tickers = this.tickers_group2,
    apikey = 'd3058ae5683b4fc19a787ceb21a87f67',
  ) {
    await this.handleCryptoChannel(time_wait, tickers, apikey, '30min');
  }

  //@Cron(CronExpression.EVERY_30_MINUTES)
  async handle30minCrypto2(
    time_wait = 4,
    tickers = this.tickers_group3,
    apikey = 'd3058ae5683b4fc19a787ceb21a87f67',
  ) {
    await this.handleCryptoChannel(time_wait, tickers, apikey, '30min');
  }

  @Cron('0 * * * *') // every 1 hour
  async handle1hourCrypto(
    time_wait = 5,
    tickers = this.tickers_group1,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    //liamsterling1@outlook.com
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1h');
  }
  // @Cron('0 * * * *') // every 1 hour
  async handle1hourCrypto1(
    time_wait = 6,
    tickers = this.tickers_group2,
    apikey = 'd3058ae5683b4fc19a787ceb21a87f67',
  ) {
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1h');
  }
  //@Cron('0 * * * *') // every 1 hour
  async handle1hourCrypto2(
    time_wait = 5,
    tickers = this.tickers_group3,
    apikey = 'd3058ae5683b4fc19a787ceb21a87f67',
  ) {
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1h');
  }

  @Cron('8 */4 * * *') // Every 4 hours at minute 8
  async handle4hourCrypto2(
    time_wait = 0,
    tickers = this.tickers_group1,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    //liamsterling1@outlook.com
    await this.handleCryptoChannel(time_wait, tickers, apikey, '4h');
  }
  //@Cron('10 */4 * * *') // Every 4 hours at minute 10
  async handle4hourCrypto3(
    time_wait = 0,
    tickers = this.tickers_group2,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    await this.handleCryptoChannel(time_wait, tickers, apikey, '4h');
  }
  //@Cron('12 */4 * * *') // Every 4 hours at minute 12
  async handle4hourCrypto4(
    time_wait = 0,
    tickers = this.tickers_group3,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    await this.handleCryptoChannel(time_wait, tickers, apikey, '4h');
  }

  @Cron('14 1 * * *') // Every day at 1:14 AM
  async handledailyCrypto(
    time_wait = 0,
    tickers = this.tickers_group1,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    //liamsterling1@outlook.com
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1day');
  }
  //@Cron('16 1 * * *') // Every day at 1:16 AM
  async handledailyCrypto1(
    time_wait = 0,
    tickers = this.tickers_group2,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1day');
  }
  //@Cron('18 1 * * *') // Every day at 1:18 AM
  async handledailyCrypto2(
    time_wait = 0,
    tickers = this.tickers_group3,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1day');
  }

  async onModuleInit() {
    this.webhooksService.sendDiscord(
      `Run On deploy:**TaskCryptoService**`,
      `RSIENDBOT TaskCryptoService`,
      'Nono',
      'ERORR_CALL',
    );
  }
}
