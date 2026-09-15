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
    if (!await this.webhooksService.runNow(this.logger,'turn_On_Off_US_Stock' ,'TasksBullBearSlackOnLyService'+'5min')) return;
    await this.CHECKBULL_BEAR_OTHER(delay);
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

      // sent some checklist
      if(this.list_symbols_ab300.length> 0 ){
        const symbols_ab300_msg = this.list_symbols_ab300.join('')
        await this.webhooksService.Post2MySlack(symbols_ab300_msg,'BUY_HOLD',this.sH_Service.DC_SL_MT.BUY_LIST)
        await this.webhooksService.sendSlackNotification(symbols_ab300_msg,this.sH_Service.Z_US_SL_.J2DAY);
        this.list_symbols_ab300 = []
      } else if(this.list_symbols_bl300.length> 0 ){
        const symbols_bl300_msg = this.list_symbols_bl300.join('')
        await this.webhooksService.Post2MySlack(symbols_bl300_msg,'SELL_AVOID',this.sH_Service.DC_SL_MT.SELL_LIST)
        await this.webhooksService.sendSlackNotification(symbols_bl300_msg,this.sH_Service.Z_US_SL_.J2DAY);
        this.list_symbols_bl300 = []
      }
    }
  }
  isNotInrangeTicker_TwReveseNOAPI = []
  isNotInrangeTicker_Tiingo= []
  list_symbols_ab300 = []
  list_symbols_bl300 = []
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
            5,
          );
          const getLastTimePost = this.webhooksService.getTsBySymbol(ticker,this.sH_Service.lastPosted)
          const match = getLastTimePost?.ts ===  last5min?.date
          if (!isWithinRange || match) {
            const mes= `**TwReveseNOAPI** <https://new-site-pwa.web.app/?stockTicker=${ticker}&endpoint=po&timeframe=1day|${ticker}> |${last5min?.close}|${last5min?.date}* || ${getLastTimePost?.ts}`
            this.isNotInrangeTicker_TwReveseNOAPI.push(mes)
            return this.CHECKBULL_5_Tiiingo([ticker],0);
          }
          const checkSl = await this.sty_SlackService.FristCheck( 
            ticker,
            data_5min,
            ['5min','15min','30min','1hour'],
            this.LocalPLWR,
            this.webhooksService,
            []
          )
          if(!checkSl){
            const text_5min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
              ticker,
              timeframe,
              data_5min,
            );
            console.log('stop at 5',133, text_5min);
            const tickeNtext = `${text_5min} || <${this.sH_Service.local4200}/price-log/${ticker}?daysRange=5|local_5min> || <${this.sH_Service.stockMk000}/price-log/${ticker}?daysRange=5|prod_5min> \n`
            if(text_5min.includes('BL_MA300🔴')){
              this.list_symbols_bl300.push(tickeNtext)
            } else{
              this.list_symbols_ab300.push(tickeNtext)
            }
            return false;
          }
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
            5,
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