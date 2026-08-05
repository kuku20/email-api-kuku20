// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
import pLimit from 'p-limit';
@Injectable()
export class TaskQQQ_SPYService {
  allkeys = 'all'; // test
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TaskQQQ_SPYService.name);
  endpointFolder = 'stock-price-check';
  runOnceAtOpen = false
  aboveList = []
  aboveListUP = []
  belowList = []
  belowListUp = []
  async onModuleInit() {
    await this.CHECKBULL_BEAR(0)
  }

  @Cron('*/5 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async CHECKBULL_BEAR_5MIN() {
    await this.CHECKBULL_BEAR(1.5);
  }

  // @Cron('*/15 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async CHECKBULL_BEAR_15MIN() {
    await this.CHECKBULL_BEAR(3,'15min',);
  }

  // @Cron('*/30 9-16 * * 1-5', { timeZone: 'America/New_York' })
  async CHECKBULL_BEAR_30MIN() {
    await this.CHECKBULL_BEAR(4,'30min',);
  }
  async CHECKBULL_BEAR(delay=2,timeframe = '5min',tickers= ['QQQ']){
    if (!this.stockHelperService.shouldRunTradingLogicUS(timeframe,this.logger)) {
      return;
    }
    try {
      await this.CHECKBULL_BEAR_processTickers(
        tickers,
        timeframe,
        delay,
      );
    } catch (error) {
      console.error('timeframe failed:', error);
      throw error;
    } 
  }
  private async CHECKBULL_BEAR_processTickers(
    tickers: string[],
    timeframe: string,
    delay = 2,
  ) {
    const limit = pLimit(2); 

    // Delay 2 minutes before processing
    await new Promise((resolve) => setTimeout(resolve, delay * 60 * 1000));

    // Prepare ticker promises with concurrency limit
    const tickerPromises = tickers.map((ticker) =>
      limit(async () => {
        try {
          let data = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
          const lastData = data[data.length - 1];
          const channel = ticker==='QQQ'? this.stockHelperService.BULL_BEAR_SL_.QQQ : this.stockHelperService.BULL_BEAR_SL_.SPY
          const text = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(ticker,timeframe,data)
          await this.webhooksService.sendSlackNotificationVN(
            timeframe,
            [ticker],
            lastData,
            channel,
            text,
          );
          const time = new Date().toLocaleString('en-US', {timeZone: 'America/New_York',});
          this.webhooksService.sendSlackNotification(text, channel);
          const text2NDLAST = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(ticker,timeframe,data.slice(0, -1))
          // await this.webhooksService.sendDiscord(
          //   `${text.substring(0,10)}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
          //   `${ticker}-ON-${timeframe}-${text.substring(0,10)}`,
          //   lastData,
          //   ticker==='QQQ'?'TSLA':'SMCI', 
          //   null,
          // );
          await this.webhooksService.sendDiscord(
            `--------------------${text +'=='+time}---------------------------`,
            `RSIENDBOT ${ticker} at ${timeframe}`,
            'Nono',
            ticker==='QQQ'?'TSLA':'SMCI', 
          );
          if(text.includes('SELL🔴🔴BL🔴🔴SELL🔴🔴')){
            const postToCSLRE = {
              channel:channel
            }
            if(text2NDLAST.includes('BUY🟢🟢AB🟢🟢SELL🔴🔴')){
              // call 15,30,1 hour ; consider buy put wait the next 5min
              const timeframes = [
                '15min',
                '30min',
                '1hour',
              ];
            
              for (const timeframe of timeframes) {
                await this.stockHelperService.CHECKBULL_BEAR_processTickers(
                  this.LocalPLWR,
                  this.webhooksService,
                  ticker,
                  timeframe,
                  postToCSLRE
                );
              }
              this.stockHelperService.bullbearDaily = this.stockHelperService.bullbearUqiue
              this.webhooksService.sendSlackNotification(`GODOWN...WAIT:CONSIDER BUY PUT; WAIT THE NEXT ${timeframe}.`, channel)
              await this.webhooksService.sendSlackNotificationVN(
                timeframe,
                [ticker],
                lastData,
                this.stockHelperService.Z_US_SL_.J3DAY,
                '*CONSIDER BUY PUT 🔴🔴🔴*'+text,
              );
              await this.webhooksService.sendDiscord(
                `--------------------${`GODOWN...WAIT:CONSIDER BUY PUT; WAIT THE NEXT ${timeframe}.` +'=='+time}---------------------------`,
                `RSIENDBOT ${ticker} at ${timeframe}`,
                'Nono',
                ticker==='QQQ'?'TSLA':'SMCI', 
              );
              this.stockHelperService.bullbearDaily = "this.stockHelperService.bullbearUqiue"
            }
          } else if(text.includes('BUY🟢🟢AB🟢🟢') || text.includes('BL50_BUYY🟢🟢🟢🔴🔴')){
            const text2NDLAST = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(ticker,timeframe,data.slice(0, -1))
            const postToCSLRE = {
              channel:channel
            }
            if(text2NDLAST.includes('SELL🔴🔴BL🔴🔴')){
              // call 15,30,1 hour ; consider buy call wait the next 5min
              const timeframes = [
                '15min',
                '30min',
                '1hour',
              ];
            
              for (const timeframe of timeframes) {
                await this.stockHelperService.CHECKBULL_BEAR_processTickers(
                  this.LocalPLWR,
                  this.webhooksService,
                  ticker,
                  timeframe,
                  postToCSLRE
                );
              }
              this.stockHelperService.bullbearDaily = this.stockHelperService.bullbearUqiue
              this.webhooksService.sendSlackNotification(`GOUP...WAIT:CONSIDER BUY CALL🟢🟢🟢; WAIT THE NEXT ${timeframe}.`, channel)
              await this.webhooksService.sendSlackNotificationVN(
                timeframe,
                [ticker],
                lastData,
                this.stockHelperService.Z_US_SL_.J3DAY,
                '*CONSIDER BUY CALL🟢🟢🟢*'+text,
              );
              await this.webhooksService.sendDiscord(
                `--------------------${`GOUP...WAIT:CONSIDER BUY CALL; WAIT THE NEXT ${timeframe}.` +'=='+time}---------------------------`,
                `RSIENDBOT ${ticker} at ${timeframe}`,
                'Nono',
                ticker==='QQQ'?'TSLA':'SMCI', 
              );
              this.stockHelperService.bullbearDaily = 'this.stockHelperService.bullbearUqiue'
            }
          } 
          if(!text2NDLAST.includes('🔴') && text.includes('🔴')){
            this.stockHelperService.bullbearDaily = this.stockHelperService.bullbearUqiue
            // green go red, buy put
            await this.webhooksService.sendSlackNotificationVN(
              timeframe,
              [ticker],
              lastData,
              channel,
              '*CONSIDER BUY PUT🔴🔴🔴*'+text,
            );
            await this.webhooksService.sendSlackNotificationVN(
              timeframe,
              [ticker],
              lastData,
              this.stockHelperService.Z_US_SL_.J3DAY,
              '*CONSIDER BUY PUT🔴🔴🔴*'+text,
            );
            this.stockHelperService.bullbearDaily = 'nomore'
          } else if(!text2NDLAST.includes('🟢') && text.includes('🟢')){
            this.stockHelperService.bullbearDaily = this.stockHelperService.bullbearUqiue
            // red go green, buy call
            await this.webhooksService.sendSlackNotificationVN(
              timeframe,
              [ticker],
              lastData,
              channel,
              '*CONSIDER BUY CALL🟢🟢🟢*'+text,
            );
            await this.webhooksService.sendSlackNotificationVN(
              timeframe,
              [ticker],
              lastData,
              this.stockHelperService.Z_US_SL_.J3DAY,
              '*CONSIDER BUY CALL🟢🟢🟢*'+text,
            );
            this.stockHelperService.bullbearDaily = 'nomore'
          }
          this.logger.log(`${ticker} processed successfully.`);
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ${error.message} \n url: http://localhost:4200/price-log/${ticker}?daysRange=500`,
            `RSIENDBOT ${ticker} at ${timeframe}`,
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