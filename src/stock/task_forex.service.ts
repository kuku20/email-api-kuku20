// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { Stratery_2Service } from './strategy/strategy2.service';
import { Crypto_Forex_Slack_Service } from './strategy/forex_crypto_strategy.service';


@Injectable()
export class TasksForexService {
  constructor(
    private readonly sH_Service: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
    private readonly webhooksService: WebhooksService,
    private readonly stratery_2Service: Stratery_2Service,
    private readonly crypto_Forex_Slack_Service: Crypto_Forex_Slack_Service,
  ) {}
  private readonly logger = new Logger(TasksForexService.name);

  private readonly forexChannels = {
    '1day': {
      buyChannel: '4HOUR_SELL_FX',
      htChannel: '4HOUR_SELL_FX',
    },
    '4h': {
      buyChannel: '4HOUR_BUY_FX',
      htChannel: '4HOUR_BUY_FX',
    },
    '1h': {
      buyChannel: '1HOUR_BUY_FX',
      htChannel: '1HOUR_BUY_FX',
    },
    '30min': {
      buyChannel: '30MIN_BUY_FX',
      htChannel: '30MIN_BUY_FX',
    },
    '15min': {
      buyChannel: '15MIN_BUY_FX',
      htChannel: '15MIN_BUY_FX',
    },
    '5min': {
      buyChannel: '15MIN_SELL_FX',
      htChannel: '15MIN_SELL_FX',
    },
  } as const;

  private readonly forexChannels_SL = {
    '1day': {
      buyChannel: this.sH_Service.FOREX_SL_['1DAY'],
      htChannel: this.sH_Service.DC_SL_MT['4HOUR_SELL_FX'],
    },
    '4h': {
      buyChannel: this.sH_Service.FOREX_SL_['4HOUR'],
      htChannel: this.sH_Service.DC_SL_MT['4HOUR_BUY_FX'],
    },
    '1h': {
      buyChannel: this.sH_Service.FOREX_SL_['1HOUR'],
      htChannel: this.sH_Service.DC_SL_MT['1HOUR_BUY_FX'],
    },
    '30min': {
      buyChannel: this.sH_Service.FOREX_SL_['30MIN'],
      htChannel: this.sH_Service.DC_SL_MT['30MIN_BUY_FX'],
    },
    '15min': {
      buyChannel: this.sH_Service.FOREX_SL_['15MIN'],
      htChannel: this.sH_Service.DC_SL_MT['15MIN_BUY_FX'],
    },
    '5min': {
      buyChannel: '15MIN_SELL_FX',
      htChannel: '15MIN_SELL_FX',
    },
  } as const;
  async handleForexChannel(
    timeWait: number,
    tickers: string[],
    apiKey: string,
    timeframe: keyof typeof this.forexChannels,
  ): Promise<void> {
    
    // const { buyChannel, htChannel } = this.forexChannels[timeframe];
    const { buyChannel, htChannel } = this.forexChannels_SL[timeframe];

    this.logger.log(`Running ${timeframe} for Forexs...`, tickers);
    // await this.processTickers_withTiingo(
      await this.processTickers_withTiingo_SL(
      tickers,
      timeframe,
      apiKey,
      buyChannel,
      htChannel,
      timeWait,
    );
    
  }

  private async processTickers_withTiingo(
    tickers: string[],
    timeframe: string,
    apikey,
    buyChannel,
    sellChannel,
    delay = 5,
  ) {
    if (!this.sH_Service.isForexMarketOpen()) {
      this.logger.log(`🕒 Forex market is CLOSED`);
      return;
    }
    this.logger.log(`✅ Forex market is OPEN`);
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));
    for (const ticker of tickers) {
      try {
        let data = await this.LocalPLWR.tiingo(ticker, timeframe, '5f7e0b2da2b5c849dfd5a3dc7938b82c02a7c6f4');
        const lastData = data[data.length - 1];
        const secondLastData = data[data.length - 2];
        const checks1 = await this.stratery_2Service.secondCheck(ticker,data,timeframe,this.webhooksService,
          [ buyChannel,
            sellChannel,
            buyChannel,
            sellChannel,],
          [],
          true,
          'TwReveseNOAPI'
        )
        if(!checks1){
          await this.webhooksService.compareAndSend1hour(
            data,
            lastData,
            secondLastData,
            ticker,
            timeframe,
            buyChannel,
            sellChannel,
          );
        }
        // await this.webhooksService.runCrOn_MA50(
        //   data,
        //   ticker,
        //   timeframe,
        //   buyChannel,
        //   sellChannel,
        // );
        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        const date = new Date();
        this.webhooksService.sendDiscord(
          `ERROR ON TasksForexService: ${timeframe} On ${date}: ${JSON.stringify(
            error,
          )}`,
          `RSIENDBOT ${ticker} at ${timeframe}`,
          'Nono',
          'ERORR_CALL',
        );
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }

  // @Cron('*/5 9-16 * * 1-5', { timeZone: 'America/New_York' }) // washlist
  async handle5minForex(time_wait = 2,tickers = this.sH_Service.Forex_pair) {
    await this.handleForexChannel(time_wait, tickers, 'all', '5min');
  }

  @Cron('3-59/15 * * * *') // every 15 minutes
  async handle15minForex(time_wait = 0,tickers = this.sH_Service.Forex_pair) {
    
    await this.handleForexChannel(time_wait, tickers, 'all', '15min');
    

  }
  @Cron('3,33 * * * *', {})
  async handle30minForex(time_wait = 0,tickers = this.sH_Service.Forex_pair) {
    
    await this.handleForexChannel(time_wait, tickers, 'all', '30min');
    
  }
  @Cron('5 * * * *') // every 1 hour at minute 5
  async handle1hourForex(time_wait = 0,tickers = this.sH_Service.Forex_pair) {
    
    await this.handleForexChannel(time_wait, tickers, 'all', '1h');
    
  }
  @Cron(CronExpression.EVERY_4_HOURS)
  async handle4hourForex(time_wait = 5,tickers = this.sH_Service.Forex_pair){
    
    await this.handleForexChannel(time_wait, tickers, 'all', '4h');
    
  }

  @Cron('8 19 * * *', {timeZone: 'America/New_York',})
  async handle1DayForex(time_wait = 0, tickers = this.sH_Service.Forex_pair) {
    await this.handleForexChannel( time_wait, tickers, 'all', '1day',);
  } 

  private async processTickers_TwReveseNOAPI(
    tickers: string[],
    timeframe: string,
    apikey,
    buyChannel,
    sellChannel,
    delay = 5,
  ) {
    // data rat la xau
  }

  async onModuleInit() {
    // await this.handle15minForex(0)
    // await this.handle30minForex(0)
    // await this.handle1hourForex(0)
    // await this.handle4hourForex(0)
    // await this.handle1DayForex(0)
    
    const msg = `turn_On_Off_Image: ${this.sH_Service.turn_On_Off_Image }\n railwayBoolen : ${this.sH_Service.railwayBoolen}`
    this.webhooksService.sendDiscordNotification(
      `Run On deploy:**TasksForexService** \n${msg}`,
      `ERORR_CALL RSIENDBOT TasksForexService `,
      'Nono',
    );
  }

  private async processTickers_withTiingo_SL(
    tickers: string[],
    timeframe: string,
    apikey,
    buyChannel,
    sellChannel,
    delay = 5,
  ) {
    if (!this.sH_Service.isForexMarketOpen()) {
      this.logger.log(`🕒 Forex market is CLOSED`);
      return;
    }
    this.logger.log(`✅ Forex market is OPEN`);
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));
    for (const ticker of tickers) {
      try {
        let data = await this.LocalPLWR.tiingo(ticker, timeframe, '5f7e0b2da2b5c849dfd5a3dc7938b82c02a7c6f4');
        // const lastData = data[data.length - 1];
        // const timediff =
        //   timeframe === '30min'
        //     ? 20
        //     : timeframe === '1h'
        //     ? 50
        //     : timeframe === '4h'
        //     ? 200
        //     : timeframe === '1day'
        //     ? 1200
        //     : 2400;
        // const isWithinRange = this.webhooksService.checktimeMinutesCST(
        //   ticker,
        //   lastData?.date,
        //   timediff,
        // );
        // if (isWithinRange) {}
        const checks1 = await this.crypto_Forex_Slack_Service.secondCheck(
          ticker
          ,data,
          timeframe,
          this.webhooksService,
          buyChannel,
          sellChannel,
           ` *Tiingo_US*\n `
        )
        this.logger.log(`${ticker} processed successfully.`);
      } catch (error) {
        const date = new Date();
        this.webhooksService.sendDiscord(
          `ERROR ON TasksForexService: ${timeframe} On ${date}: ${JSON.stringify(
            error,
          )}`,
          `RSIENDBOT ${ticker} at ${timeframe}`,
          'Nono',
          'ERORR_CALL',
        );
        this.logger.error(`Error processing ${ticker}: ${error.message}`);
      }
    }
  }
}
