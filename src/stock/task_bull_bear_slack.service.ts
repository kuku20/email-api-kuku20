// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
import pLimit from 'p-limit';
import { Sty_Slack_OnLy_Service } from './strategy/strategy3_sl_only.service';
@Injectable()
export class TasksBullBearSlackOnLyService {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly sH_Service: StockHelperService,
    private readonly sty_SlackService: Sty_Slack_OnLy_Service,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksBullBearSlackOnLyService.name);
  async onModuleInit() {
    // this.sH_Service.bullbearDaily = this.sH_Service.bullbearUqiue
    // await this.CHECKBULL_5_15_30_1h(['ORCL'],0)
    // await this.CHECKBULL_BEAR_OTHER_5MIN(0)
  }

  @Cron('*/5 9-16 * * 1-5', { timeZone: 'America/New_York' }) // washlist
  async CHECKBULL_BEAR_OTHER_5MIN(delay = 2) {
    const runNow = await this.webhooksService.getSameBool()
    const str = JSON.stringify(runNow, null, 2);
    if(runNow.sameOrNot){
      await this.webhooksService.Post2MySlack(str, 'US_CHECK_IN','86UamrSwHhQYgEszLmcP')
      this.logger.error(`✅ runMe Now at: ${runNow.textout}`)
      await this.sH_Service.sendBatchNotification('START',str,[this.sH_Service.Z_US_SL_.OR],this.webhooksService,100,);
      await this.CHECKBULL_BEAR_OTHER(delay);
      return 
    } 
    this.logger.error(`❌:Im running somewhere else ${runNow?.textout}`)
  }
  TiingoCount = 0
  async CHECKBULL_BEAR_OTHER(delay=2,symbols= DataSymbols.watchlist){
    if (!this.sH_Service.shouldRunTradingLogicUS('5min',this.logger)) {
      return;
    }
    this.sH_Service.bullbearDaily = this.sH_Service.bullbearUqiue
    this.sH_Service.slackPosted = []
    this.sH_Service.apitwelveCount = 0
    this.TiingoCount = 0
    try {
      const addToDailyRun = await this.LocalPLWR.FireBaseApi('get',`stock-related/addToDailyRun.json`,'')
      const moreSymbols = Object.keys(addToDailyRun)
      const todayMostGains = await this.LocalPLWR.FireBaseApi('get',`${this.sH_Service.todayUpGains}.json`,'')
      const moreSymbols2 = Object.keys(todayMostGains)

      const uniqueCombine =  Array.from(new Set([...moreSymbols, ...symbols]))
      await this.CHECKBULL_5_15_30_1h(uniqueCombine,delay)
    } catch (error) {
      console.error('timeframe failed:', error);
      throw error;
    } finally{
      console.log(this.sH_Service.apitwelveCount)
      const webhooks = Array.from(new Set([...this.sH_Service.slackPosted]))
      await this.sH_Service.sendBatchNotification('START','dailyrunon5min',webhooks,this.webhooksService,300,);
      if(this.TiingoCount>0){
        await this.sH_Service.sendBatchNotification('START','checking_TiingoCount_'+this.TiingoCount,[this.sH_Service.Z_US_SL_.OR],this.webhooksService,100,)
      }
      this.sH_Service.bullbearDaily = 'setto0'
      // sent list of is not inrange
      if(this.isNotInrangeTicker_TwReveseNOAPI.length>0){
        await this.sH_Service.sleep(500);
        const isNotRange_msg = this.isNotInrangeTicker_TwReveseNOAPI.join('\n')
        await this.webhooksService.sendSlackNotification(isNotRange_msg,this.sH_Service.Z_US_SL_.OR4);
        this.isNotInrangeTicker_TwReveseNOAPI = []
      } else  if(this.isNotInrangeTicker_Tiingo.length>0){
        await this.sH_Service.sleep(500);
        const isNotRange_msg = this.isNotInrangeTicker_Tiingo.join('\n')
        await this.webhooksService.sendSlackNotification(isNotRange_msg,this.sH_Service.Z_US_SL_.OR4);
        this.isNotInrangeTicker_Tiingo = []
      }
    }
  }
  isNotInrangeTicker_TwReveseNOAPI = []
  isNotInrangeTicker_Tiingo= []
  async CHECKBULL_5_15_30_1h(
    tickers: string[],
    delay = 2,
  ) {
    this.sH_Service.ALL_IN_ONE = true
    const limit = pLimit(4); // Limit the concurrency to 8 at a time

    const washselllists =[...(await this.LocalPLWR.loadWashSellList()) ||
      this.LocalPLWR.getWashSellList(),'QQQ','SPY'];
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));

    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {
        if (washselllists?.includes(ticker)) {
          console.log(`⏭️ Skipping ${ticker} — in wash sell list`);
          return; // Skip this ticker and move on
        }
        try {
          const timeframe = '5min'
          const data_5min = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
          const last5min = data_5min[data_5min.length-1]
          const isWithinRange = this.webhooksService.checktimeMinutesEST(
            ticker,
            last5min?.date,
            10,
          );
          const getLastTimePost = this.webhooksService.getTsBySymbol(ticker,this.sH_Service.lastPosted)
          const match = getLastTimePost?.ts ===  last5min?.date
          if (!isWithinRange || match) {
            const mes= `**TwReveseNOAPI** <https://new-site-pwa.web.app/?stockTicker=${ticker}&endpoint=po&timeframe=1day|${ticker}> |${last5min?.close}|${last5min?.date}* || ${getLastTimePost?.ts}`
            this.isNotInrangeTicker_TwReveseNOAPI.push(mes)
            return this.CHECKBULL_5_Tiiingo([ticker],0);
          }
          await this.sty_SlackService.FristCheck( 
            ticker,
            data_5min,
            ['5min','15min','30min','1hour'],
            this.LocalPLWR,
            this.webhooksService,
            []
          )
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ${error.message} \n url: ${this.sH_Service.local4200}/price-log/${ticker}?daysRange=500`,
            `RSIENDBOT ${ticker} at fullList`,
            'Nono',
            'ERORR_CALL',
          );
          
          this.logger.error(`Error processing ${ticker}: ${error.message}`);
        }
      }),
    );

    // Wait for all ticker promises to complete concurrently (with concurrency limit)
    await Promise.all(tickerPromises);
    this.sH_Service.ALL_IN_ONE = false
  }
  async CHECKBULL_5_Tiiingo(
    tickers: string[],
    delay = 2,
  ) {
    this.TiingoCount +=1
    const limit = pLimit(4); // Limit the concurrency to 8 at a time

    const washselllists =[...(await this.LocalPLWR.loadWashSellList()) ||
      this.LocalPLWR.getWashSellList(),'QQQ','SPY'];
    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));

    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {
        if (washselllists?.includes(ticker)) {
          console.log(`⏭️ Skipping ${ticker} — in wash sell list`);
          return; // Skip this ticker and move on
        }
        try {
          const data_5min = await this.LocalPLWR.tiingo_US(ticker, '5min');
          const last5min = data_5min[data_5min.length-1]
          const isWithinRange = this.webhooksService.checktimeMinutesCST(
            ticker,
            last5min?.date,
            10,
          );
          const getLastTimePost = this.webhooksService.getTsBySymbol(ticker,this.sH_Service.lastPosted)
          const match = getLastTimePost?.ts ===  last5min?.date
          if (!isWithinRange || match) {
            const mes= `*Tiingo_US** <https://new-site-pwa.web.app/?stockTicker=${ticker}&endpoint=po&timeframe=1day|${ticker}> |${last5min?.close}|${last5min?.date}* || ${getLastTimePost?.ts}`
            this.isNotInrangeTicker_Tiingo.push(mes)
            return 0
          }
          await this.sty_SlackService.secondCheck( 
            ticker,
            data_5min,
            '5min',
            this.webhooksService,
            []
          )
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ${error.message} \n url: ${this.sH_Service.local4200}/price-log/${ticker}?daysRange=500`,
            `RSIENDBOT ${ticker} at fullList`,
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