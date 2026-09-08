// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { Stratery_2Service } from './strategy/strategy2.service';

@Injectable()
export class TasksForexService {
  constructor(
    private readonly sH_Service: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
    private readonly webhooksService: WebhooksService,
    private readonly stratery_2Service: Stratery_2Service,
  ) {}
  private readonly logger = new Logger(TasksForexService.name);
  tickers = ['EURUSD', 'GBPUSD'];
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
  } as const;
  async handleForexChannel(
    timeWait: number,
    tickers: string[],
    apiKey: string,
    timeframe: keyof typeof this.forexChannels,
  ): Promise<void> {
    this.sH_Service.turn_On_Off_Forex = await this.webhooksService.getTunOnOff('turn_On_Off_Forex')
    const { buyChannel, htChannel } = this.forexChannels[timeframe];

    this.logger.log(`Running ${timeframe} for Forexs...`, tickers);

    await this.processTickers_withTiingo(
      tickers,
      timeframe,
      apiKey,
      buyChannel,
      htChannel,
      timeWait,
    );
    this.sH_Service.turn_On_Off_Forex = true;  // set_True-GO-IN-Get_Web
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
            data.reverse(),
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
  @Cron('*/15 * * * *') // every 15 minutes
  async handle15minForex(time_wait = 3,tickers = this.tickers) {
    await this.handleForexChannel(time_wait, tickers, 'all', '15min');
  }
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handle30minForex(time_wait = 3,tickers = this.tickers) {
    await this.handleForexChannel(time_wait, tickers, 'all', '30min');
  }
  @Cron('0 * * * *') // every 1 hour
  async handle1hourForex(time_wait = 5,tickers = this.tickers) {
    await this.handleForexChannel(time_wait, tickers, 'all', '1h');
  }
  @Cron(CronExpression.EVERY_4_HOURS)
  async handle4hourForex(time_wait = 5,tickers = this.tickers){
    await this.handleForexChannel(time_wait, tickers, 'all', '4h');
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handle1DayForex(time_wait = 5,tickers = this.tickers){
    await this.handleForexChannel(time_wait, tickers, 'all', '1day');
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
    this.sH_Service.turn_On_Off_Forex = await this.webhooksService.getTunOnOff('turn_On_Off_Forex')
    const msg = `turn_On_Off_Forex: ${this.sH_Service.turn_On_Off_Forex }\n railwayBoolen : ${this.sH_Service.railwayBoolen}`
    this.webhooksService.sendDiscordNotification(
      `Run On deploy:**TasksForexService** \n${msg}`,
      `ERORR_CALL RSIENDBOT TasksForexService `,
      'Nono',
    );
  }
}
