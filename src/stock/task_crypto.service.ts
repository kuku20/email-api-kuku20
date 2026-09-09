// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { Stratery_2Service } from './strategy/strategy2.service';

@Injectable()
export class TaskCryptoService {
  constructor(
    private readonly sH_Service: StockHelperService,
    private readonly webhooksService: WebhooksService,
    private readonly LocalPLWR: LocalPLWR,
    private readonly stratery_2Service: Stratery_2Service,
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
        const timediff =
          timeframe === '30min'
            ? 20
            : timeframe === '1h'
            ? 50
            : timeframe === '4h'
            ? 200
            : timeframe === '1day'
            ? 1200
            : 2400;
        const isWithinRange = this.webhooksService.checktimeMinutesEST(
          ticker,
          lastData?.date,
          timediff,
        );
        if (isWithinRange) {
          // await this.webhooksService.runCrOn_MA50(
          //   data,
          //   ticker,
          //   timeframe,
          //   HT_Channel,
          //   B_Channel,
          // );
          const checks1 = await this.stratery_2Service.secondCheck(
            ticker,
            data,
            timeframe,
            this.webhooksService,
            [B_Channel, HT_Channel, B_Channel, HT_Channel],
            [],
            true,
            'TwReveseNOAPI',
          );
          if (!checks1) {
            await this.webhooksService.compareAndSend1hour(
              data,
              lastData,
              secondLastData,
              ticker,
              timeframe,
              B_Channel,
              HT_Channel,
            );
          }
        } else {
          const msg = `*${lastData?.date}*-EST_TIME\n*Close:*${lastData?.close}\nisWithinRange:false\n`;
          await this.webhooksService.Post2MySlack(
            msg,
            `${ticker}_${timeframe}`,
            '86UamrSwHhQYgEszLmcP',
          );
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
            await this.sH_Service.BuyOnly_StochRSICrossAB200(
              lastData,
              secondLastData,
            );
          if (BuyOnly_StochRSICrossAB200.PriceCrMA200) {
            await this.webhooksService.sendDiscord(
              `SBUY-BuyOnly_StochRSICrossAB200-PriceCrMA200-TwReveseNOAPI-${timeframe}-${lastData?.close}-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}-${lastData?.close}`,
              lastData,
              HT_Channel,
              data,
            );
            return;
          } else {
            await this.stratery_2Service.secondCheck(
              ticker,
              data,
              timeframe,
              this.webhooksService,
              [B_Channel, HT_Channel, B_Channel, HT_Channel],
              [],
              true,
              `TwReveseNOAPI`,
            );
          }
        } else {
          const msg = `*${lastData?.date}*-EST_TIME\n*Close:*${lastData?.close}\nisWithinRange:false\n`;
          await this.webhooksService.Post2MySlack(
            msg,
            `${ticker}_${timeframe}`,
            '86UamrSwHhQYgEszLmcP',
          );
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
  tickers_group2 = [
    'SOLUSD',
    // 'ADAUSD',
    // 'XRPUSD',
    'BNBUSD',
    'LINKUSD',
  ];
  tickers_group3 = [
    // 'SUIUSD',
    'UNIUSD',
    'AAVEUSD',
    'COMPUSD',
    'AVAXUSD',
  ];
  private readonly cryptoChannels = {
    '1day': {
      buyChannel: 'CRYPTO_WATCH',
      htChannel: 'CRYPTO_WATCH',
    },
    '4h': {
      buyChannel: 'CR_4H_BUY',
      htChannel: 'CR_4H_BUY',
    },
    '1h': {
      buyChannel: 'CR_1H_BUY',
      htChannel: 'CR_1H_BUY',
    },
    '30min': {
      buyChannel: 'CR_30M_BUY',
      htChannel: 'CR_30M_BUY',
    },
    '15min': {
      buyChannel: 'CRYPTO_EARLY_5MIN',
      htChannel: 'CRYPTO_EARLY_5MIN',
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
    const { buyChannel, htChannel } = this.cryptoChannels['15min'];
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.processTickers15m(
      tickers,
      '15min',
      'all',
      buyChannel,
      htChannel,
      time_wait,
    );
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handle30pCrypto(
    time_wait = 4,
    tickers = this.tickers_group1,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    //liamsterling1@outlook.com)
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.handleCryptoChannel(time_wait, tickers, apikey, '30min');
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
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
    time_wait = 6,
    tickers = this.tickers_group1,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    //liamsterling1@outlook.com
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1h');
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
  }
  @Cron('0 * * * *') // every 1 hour
  async handle1hourCrypto1(
    time_wait = 6,
    tickers = this.tickers_group2,
    apikey = 'd3058ae5683b4fc19a787ceb21a87f67',
  ) {
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1h');
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
  }
  @Cron('0 * * * *') // every 1 hour
  async handle1hourCrypto2(
    time_wait = 5,
    tickers = this.tickers_group3,
    apikey = 'd3058ae5683b4fc19a787ceb21a87f67',
  ) {
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1h');
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
  }

  @Cron('8 */4 * * *') // Every 4 hours at minute 8
  async handle4hourCrypto2(
    time_wait = 0,
    tickers = this.tickers_group1,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    //liamsterling1@outlook.com
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.handleCryptoChannel(time_wait, tickers, apikey, '4h');
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
  }
  @Cron('10 */4 * * *') // Every 4 hours at minute 10
  async handle4hourCrypto3(
    time_wait = 0,
    tickers = this.tickers_group2,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.handleCryptoChannel(time_wait, tickers, apikey, '4h');
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
  }
  @Cron('12 */4 * * *') // Every 4 hours at minute 12
  async handle4hourCrypto4(
    time_wait = 0,
    tickers = this.tickers_group3,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.handleCryptoChannel(time_wait, tickers, apikey, '4h');
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
  }

  @Cron('14 1 * * *') // Every day at 1:14 AM
  async handledailyCrypto(
    time_wait = 0,
    tickers = this.tickers_group1,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    //liamsterling1@outlook.com
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1day');
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
  }
  @Cron('16 1 * * *') // Every day at 1:16 AM
  async handledailyCrypto1(
    time_wait = 0,
    tickers = this.tickers_group2,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1day');
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
  }
  @Cron('18 1 * * *') // Every day at 1:18 AM
  async handledailyCrypto2(
    time_wait = 0,
    tickers = this.tickers_group3,
    apikey = '2711824a92bc40498c8bc30728813e2a',
  ) {
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    await this.handleCryptoChannel(time_wait, tickers, apikey, '1day');
    this.sH_Service.turn_On_Off_Crypto = true; // set_True-GO-IN-Get_Web
    await this.webhooksService.deleteSLChannel(
      Object.values(this.sH_Service.BULL_BEAR_SL_),
    );
  }

  async onModuleInit() {
    // await this.handle5pCrypto(0)
    // await this.handle30pCrypto(0)
    // await this.handle1hourCrypto(0)
    // await this.handle4hourCrypto2(0)
    // await this.handledailyCrypto(0)
    this.sH_Service.turn_On_Off_Crypto = await this.webhooksService.getTunOnOff(
      'turn_On_Off_Crypto',
    );
    const msg = `turn_On_Off_Crypto: ${this.sH_Service.turn_On_Off_Crypto}\n railwayBoolen:${this.sH_Service.railwayBoolen}`;
    this.webhooksService.sendDiscordNotification(
      `Run On deploy:**TaskCryptoService** \n${msg}`,
      `ERORR_CALL RSIENDBOT TaskCryptoService `,
      'Nono',
    );
  }

  private async processTickers1hour_tiingoAPI(
    tickers: string[],
    timeframe: string,
    apikey: string,
    B_Channel,
    HT_Channel,
    delay = 5,
  ) {
    const tickersString = tickers.join(',');
    let result = await this.LocalPLWR.tiingo_CRYPTO_M_TICKER_STR(
      tickersString,
      timeframe,
      '5f7e0b2da2b5c849dfd5a3dc7938b82c02a7c6f4',
    );
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
        let data = this.LocalPLWR.getTickerData(result, ticker.toLowerCase());
        const lastData = data[data.length - 1];
        const secondLastData = data[data.length - 2];
        const timediff =
          timeframe === '30min'
            ? 20
            : timeframe === '1h'
            ? 50
            : timeframe === '4h'
            ? 200
            : timeframe === '1day'
            ? 1200
            : 2400;
        const isWithinRange = this.webhooksService.checktimeMinutesCST(
          ticker,
          lastData?.date,
          timediff,
        );
        if (isWithinRange) {
          // await this.webhooksService.runCrOn_MA50(
          //   data,
          //   ticker,
          //   timeframe,
          //   HT_Channel,
          //   B_Channel,
          // );
          const checks1 = await this.stratery_2Service.secondCheck(
            ticker,
            data,
            timeframe,
            this.webhooksService,
            [B_Channel, HT_Channel, B_Channel, HT_Channel],
            [],
            true,
            'tiingo',
          );
          if (!checks1) {
            await this.webhooksService.compareAndSend1hour(
              data,
              lastData,
              secondLastData,
              ticker,
              timeframe,
              B_Channel,
              HT_Channel,
            );
          }
        } else {
          await this.processTickers1hour(
            [ticker],
            timeframe,
            apikey,
            B_Channel,
            HT_Channel,
            0,
          );
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

  private async processTickers15m_tiingoAPI(
    tickers: string[],
    timeframe: string,
    apikey: string,
    B_Channel,
    HT_Channel,
    delay = 5,
  ) {
    const tickersString = tickers.join(',');
    let result = await this.LocalPLWR.tiingo_CRYPTO_M_TICKER_STR(
      tickersString,
      timeframe,
      '5f7e0b2da2b5c849dfd5a3dc7938b82c02a7c6f4',
    );
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
        let data = this.LocalPLWR.getTickerData(result, ticker.toLowerCase());

        const lastData = data[data.length - 1];
        const secondLastData = data[data.length - 2];

        const isWithinRange = this.webhooksService.checktimeMinutesCST(
          ticker,
          lastData?.date,
          13,
        );
        if (isWithinRange) {
          const BuyOnly_StochRSICrossAB200 =
            await this.sH_Service.BuyOnly_StochRSICrossAB200(
              lastData,
              secondLastData,
            );
          if (BuyOnly_StochRSICrossAB200.PriceCrMA200) {
            await this.webhooksService.sendDiscord(
              `SBUY-BuyOnly_StochRSICrossAB200-PriceCrMA200-tiingoAPI-${timeframe}-${lastData?.close}-(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
              `${ticker}-ON-${timeframe}-${lastData?.close}`,
              lastData,
              HT_Channel,
              data,
            );
            return;
          } else {
            await this.stratery_2Service.secondCheck(
              ticker,
              data,
              timeframe,
              this.webhooksService,
              [B_Channel, HT_Channel, B_Channel, HT_Channel],
              [],
              true,
              `tiingoAPI`,
            );
          }
        } else {
          await this.processTickers15m(
            [ticker],
            timeframe,
            apikey,
            B_Channel,
            HT_Channel,
            0,
          );
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
}
