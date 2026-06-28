// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
import pLimit from 'p-limit';
@Injectable()
export class TasksBullBearGain_CalService {
  allkeys = 'all'; // test
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(TasksBullBearGain_CalService.name);
  endpointFolder = 'stock-price-check';
  runOnceAtOpen = false
  aboveList = []
  aboveListUP = []
  belowList = []
  belowListUp = []
  async onModuleInit() {
    // const symbols =   await this.getTodaySymbols()
    // await this.CHECKBULL_BEAR_OTHER(0,symbols);
  }


 
  @Cron('*/5 9-16 * * 1-5', { timeZone: 'America/New_York' }) // washlist
  async CHECKBULL_BEAR_OTHER_5MIN() {
    const symbols =   await this.getTodaySymbols()
    await this.CHECKBULL_BEAR_OTHER(1.5,symbols);
  }

  async CHECKBULL_BEAR_OTHER(delay=2,symbols= DataSymbols.watchlist){
    this.stockHelperService.apitwelveCount = 0
    if (!this.stockHelperService.shouldRunTradingLogicUS('5min',this.logger)) {
      return;
    }
    try {
      await this.CHECKBULL_5_15_30_1h(symbols,delay)
      await this.webhooksService.sendSlackNotification(
        '=================================================', 
        this.stockHelperService.INTRA_30M_SL.US_30M_WATCH)
    } catch (error) {
      console.error('timeframe failed:', error);
      throw error;
    } finally{
      console.log(this.stockHelperService.apitwelveCount)
    }
  }

  async CHECKBULL_5_15_30_1h(
    tickers: string[],
    delay = 2,
  ) {
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
        const checktext = 'AB🟢🟢BUYY🟢🟢'
        try {
          let FullText = '';
          let bullishCount = 0;
          let bullishFCount = 0;
          let aboveCount = 0;
          const timeframe = '5min'
          const data_5min = await this.LocalPLWR.TwReveseNOAPI(ticker, timeframe);
          const text_5min = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(
              ticker,
              timeframe,
              data_5min
          );
          FullText += `${text_5min}\n`;
          if(text_5min.includes('CrAbMA')){
            let nextText = ''
            if(text_5min.includes('CrAbMA50')){
              nextText = 'PREPARE TO BUY'
            } else if(text_5min.includes('CrAbMA50')){
              nextText = 'BUY '
            }
            await this.webhooksService.sendDiscord(
              FullText,
              `${ticker}-ON-${timeframe}-${'macdCrossAB'}`,
              data_5min[data_5min.length-1],
              'US_EARLY_5MIN', 
              data_5min,
            );
            
            const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
              '5min',
              [ticker],
              data_5min[data_5min.length-1],
              this.stockHelperService.INTRA_30M_SL.US_30M_MACDCR_200,
              `\n${FullText} \n`
            );
            const blockre = this.webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
            await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
          }
          if(text_5min.includes('BIG_🟡🟡_VOL')
              && text_5min.includes('bar_🟢_green') 
              && text_5min.includes('AB🟢🟢BUYY🟢🟢')){
            const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
              '5min',
              [ticker],
              data_5min[data_5min.length-1],
              this.stockHelperService.INTRA_30M_SL.US_30M_MACDCR_50,
              `\n${FullText} \n`
            );
            const blockre = this.webhooksService.getSlBlock(ticker,'accessory_price_check',ticker)
              // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
            await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
            await this.webhooksService.sendDiscord(
              FullText,
              `${ticker}-ON-${timeframe}-${'macdCrossAB'}`,
              data_5min[data_5min.length-1],
              'US_EARLY_15MIN', 
              data_5min,
            );
          }
          else if(text_5min.includes(checktext)){
            // send can buy: check macd call the 
            const data_15min = await this.LocalPLWR.TwReveseNOAPI(ticker, '15min');
            const text_15min = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(
              ticker,
              '15min',
              data_15min
            );
            FullText += `${text_15min}\n`;
            const inWt = DataSymbols.watchlist.includes(ticker) && (text_15min.includes('BUYY🟢🟢')|| text_15min.includes('AB🟢🟢'))
            if(inWt){
            // sent with good to buy check macd 0.1<0.6
              const data_30min = await this.LocalPLWR.TwReveseNOAPI(ticker, '30min');
              const text_30min = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(
                ticker,
                '30min',
                data_30min
              );
              FullText += `${text_30min}\n`;
              if(text_30min.includes('BUYY🟢🟢')|| text_30min.includes('AB🟢🟢')){
                // sent with good to buy check macd 0.1<0.6
                const data_1hour = await this.LocalPLWR.TwReveseNOAPI(ticker, '1hour');
                const text_1hour = await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(
                  ticker,
                  '1hour',
                  data_1hour
                );
                FullText += `${text_1hour}\n`;
                if(text_30min.includes('BUYY🟢🟢')|| text_30min.includes('AB🟢🟢')){
                  // sent with good to buy check macd 0.1<0.6
                                  // send to watchlist
                  await this.webhooksService.sendDiscord(
                    FullText,
                    `${ticker}-ON-${timeframe}-${'macdCrossAB'}`,
                    data_5min[data_5min.length-1],
                    'US_5M_HT', 
                    data_5min,
                  );
                  const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
                    '5min',
                    [ticker],
                    data_5min[data_5min.length-1],
                    this.stockHelperService.INTRA_30M_SL.US_30M_WATCH,
                    `\n${FullText} \n`
                  );
                  const blockre = this.webhooksService.getSlBlock(ticker,'accessory_price_check',ticker)
                    // await this.webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                  await this.webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
                  if(text_15min.includes(checktext)){
                    await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'heart');
                    if(text_1hour.includes(checktext)){
                      await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'cold_face');
                    }
                  } else if(text_30min.includes('macdCr_N')|| text_15min.includes('macdCr_N')){
                    await this.webhooksService.addReaction_SLack(postToCSLRE.postToCSLRE.channel, postToCSLRE.postToCSLRE.ts, 'b');
                  }
                  return
                }
              } 
              else {
                console.log('stop at 30')
                return
              }
            } else if(text_15min.includes('macdCr_N')){
              const postToCSLRE = await this.webhooksService.sendSlackNotificationVN(
                '5min',
                [ticker],
                data_5min[data_5min.length-1],
                this.stockHelperService.INTRA_30M_SL.US_30M_MACDCR_BL,
                `\n${FullText} \n`
              );
              await this.webhooksService.sendDiscord(
                FullText,
                `${ticker}-ON-${timeframe}-${'macdCrossAB'}`,
                data_5min[data_5min.length-1],
                'US_30M_HT', 
                data_5min,
              );
            } else {
              console.log('stop at 15')
              return
            }
          } else {
            console.log('stop at 5')
            return
          }
        } catch (error) {
          // Send error notification and log the error
          await this.webhooksService.sendDiscord(
            `ERROR ${error.message} \n url: http://localhost:4200/price-log/${ticker}?daysRange=500`,
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

  async getTodaySymbols(){
    const mostActivesSym = await  this.getMostActiveP('most-actives')
    const mostGainsSym = await  this.getMostActiveP('gainers')
    console.log(mostActivesSym.length,mostGainsSym.length)
    const Er_2wah = await  this.getEarning()
    const combine4h = [...mostActivesSym, ...mostGainsSym,...Er_2wah]
    const uniqueCombine4h = Array.from(new Set(combine4h));
    const newAB = await this.checkMk(uniqueCombine4h)
    const result = Array.from(new Set(newAB.filter(Boolean)));
    return  result
  }

  async getMostActiveP (endpoint = 'most-actives'){
    const actives:DataSymbols.StockQuoteFMP[] = await this.LocalPLWR.newFMP_NewEndPoint(endpoint)
    const activesGreen = actives.filter(
      (sys) => sys.changesPercentage > 0 && sys.changesPercentage < 5
    );
    const activesGreenSymbol = activesGreen.map((item: any) => item.symbol)
    const skipFromWatchlist = activesGreenSymbol.filter(item => !DataSymbols.watchlist.includes(item));
    return skipFromWatchlist
   }
  
   async getEarning (){
    const Earning:DataSymbols.EarningsCalendar[] = await this.LocalPLWR.earningsCal_FINNHUB()
    const EarningSymbol = Earning.map((item: any) => item.symbol)
    const skipFromWatchlist = EarningSymbol.filter(item => !DataSymbols.watchlist.includes(item));
    return skipFromWatchlist
   }
  
   async checkMk(symbols: string[]): Promise<string[]> {
    const newData =[]
    const newData2 =[]
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        if (DataSymbols.allabove500million.includes(symbol)) {
          return symbol;
        } else if(DataSymbols.blow500M.includes(symbol)|| DataSymbols.skipSymbols.includes(symbol)){
          return
        }
        console.log('call',symbol)
        newData2.push(symbol)
        const marketCap =
          (await this.LocalPLWR.getMarketCap_FINNHUB(symbol))?.marketCap ?? 0;
        if(marketCap > 500_000_000){
          console.log(symbol,marketCap)
          newData.push(symbol)
        }
        return marketCap > 500_000_000 ? symbol : null;
      })
    );
    // await this.stockHelperService.writeAbove2BillionToFile(newData,`Above__Billion`);
    // await this.stockHelperService.writeAbove2BillionToFile(newData2,`BL__Billion`);
  
    return results.filter((symbol): symbol is string => symbol !== null);
  }
}