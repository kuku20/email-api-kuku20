import { Injectable, Logger } from '@nestjs/common';
import { StockHelperService } from '../stockHelper.service';
import * as DataSymbols from '../dto';
import { StockData } from '../dto';
import { ESLint } from 'eslint';
@Injectable()
export class Crypto_Forex_Slack_Service {
  constructor(private readonly sH_Service: StockHelperService) {}
  // async CHECKBULL_BEAR_processTickers

  async FristCheck(
    ticker: string,
    data_5min,
    timeframes: string[], // array [first_timeframe,second_timeframe]5min,15min,30min,1hour
    LocalPLWR,
    webhooksService,
    Channels_7SL: string[], // array
  ) {
    let FullText = '';
    const checktext = 'AB🟢🟢BUYY🟢🟢';
    const inWlist = DataSymbols.watchlist.includes(ticker);
    const SL_Short = this.sH_Service.INTRA_30M_SL_;

    const SL_Channel_BIG_VOL =
      Channels_7SL[0] || (inWlist ? SL_Short.MACDCR_50 : SL_Short.MACDCR_BL);
    const SL_Channel_AB_MA50 =
      Channels_7SL[1] || (inWlist ? SL_Short.MACDCR_100 : SL_Short.MACDCR_200);
    const SL_Channel_macdCr_N = Channels_7SL[2] || SL_Short.MACDCR_BL;
    const SL_Channel_ALL_GREEN = Channels_7SL[3] || SL_Short.ALLGREEN;
    const SL_Channel_ALL_RED = Channels_7SL[4] || SL_Short.D_DOWN;
    const SL_Channel_WATCH = Channels_7SL[5] || SL_Short.WATCH;
    const SL_Channel_EARLY_CHECK = Channels_7SL[6] || SL_Short.EARLY_CHECK;
    const SL_Channel_MACDCR_BL_OT = Channels_7SL[7] || SL_Short.MACDCR_BL_OT;

    const last5min = data_5min[data_5min.length - 1];
    const text_5min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
      ticker,
      timeframes[0],
      data_5min,
    );
    const MACDP = last5min.divergence > 0;
    const closeCrosMA50 =
      last5min.close > last5min.MA50 &&
      data_5min[data_5min.length - 2].close <
        data_5min[data_5min.length - 2].MA50;
    const closeCrosMA200 =
      last5min.close > last5min.MA200 &&
      data_5min[data_5min.length - 2].close <
        data_5min[data_5min.length - 2].MA200;

    FullText += `${text_5min}\n`;
    try {
      if (
        text_5min.includes('BIG_🟡🟡_VOL') &&
        text_5min.includes('bar_🟢_green')
      ) {
        // && text_5min.includes('AB🟢🟢BUYY🟢🟢')
        const data_15min = await LocalPLWR.TwReveseNOAPI(ticker, timeframes[1]);
        const text_15min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
          ticker,
          timeframes[1],
          data_15min,
        );
        FullText += `\n${text_15min}\n`;
        if (true) {
          const FTextWInDicator = '*BIG_🟡🟡_VOL BUY_KEY*\n' + FullText;
          const fileBuffer5m = await webhooksService.captureChart(
            data_5min,
            ticker,
            SL_Channel_BIG_VOL + '-5MIN',
            text_5min,
          );
          const tsNCh =
            webhooksService.getTsBySymbol(
              ticker,
              this.sH_Service.watchlistSl_tss,
            ) ||
            webhooksService.getTsBySymbol(
              ticker,
              this.sH_Service.holdingSl_tss,
            );
          const blockreW = [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: FTextWInDicator,
              },
            },
            {
              type: 'section',
              block_id: ticker,
              text: {
                type: 'mrkdwn',
                text: 'Select a interval',
              },
              accessory: {
                type: 'external_select',
                placeholder: {
                  type: 'plain_text',
                  text: 'Search timeframe',
                },
                action_id: 'timeframe_interval',
                min_query_length: 1,
              },
            },
          ];
          if (fileBuffer5m) {
            const postTo5m = await webhooksService.postSlackImage(
              SL_Channel_BIG_VOL,
              fileBuffer5m,
              `${ticker}-5min.png`,
              FTextWInDicator,
            );
            const messageTs = await webhooksService.getSlackMessageTs(
              SL_Channel_BIG_VOL,
              postTo5m.files?.[0].id,
            );
            if (tsNCh) {
              const signalThread = this.sH_Service.getSlackMessageLink(
                tsNCh.channel,
                tsNCh.ts,
              );
              // reply to self msg
              await webhooksService.reply_SLack(
                SL_Channel_BIG_VOL,
                messageTs,
                signalThread,
              );
              // replay to btn-watch ts
              await webhooksService.reply_SLack(
                tsNCh.channel,
                tsNCh.ts,
                FTextWInDicator + `<${postTo5m?.files[0]?.permalink}|image>`,
                blockreW,
              );
            } else {
              const blockre = webhooksService.getSlBlock(
                ticker,
                'accessory_full_watchlist',
                ticker,
              );
              await webhooksService.reply_SLack(
                SL_Channel_BIG_VOL,
                messageTs,
                'withBlock',
                blockre,
              );
            }
            const fileBuffer15m = await webhooksService.captureChart(
              data_15min,
              ticker,
              `${SL_Channel_BIG_VOL}-15MIN`,
              text_15min,
            );
            if (fileBuffer15m) {
              const postTo15m = await webhooksService.postSlackImage(
                SL_Channel_BIG_VOL,
                fileBuffer15m,
                `${ticker}-15min.png`,
                text_15min,
                messageTs,
              );
              if (tsNCh) {
                await webhooksService.reply_SLack(
                  tsNCh.channel,
                  tsNCh.ts,
                  text_15min + `<${postTo15m?.files[0]?.permalink}|image>`,
                );
              }
              const msgMySl =
                FTextWInDicator +
                `\n <${this.sH_Service.imageHostUrl}/slack/slack-image/${postTo5m.files?.[0].id}|5m-slackImage>  || <${this.sH_Service.imageHostUrl}/slack/slack-image/${postTo15m.files?.[0].id}|15m-slackImage>  `;
              await webhooksService.Post2MySlack(msgMySl, ticker,timeframes[0]);
            } else {
              const pathSym =
                `${SL_Channel_BIG_VOL}-15MIN/${ticker}`.toUpperCase();
              const imageWEB = `|| <${this.sH_Service.stockMk000}/capture-target/${pathSym}|prodUrl>`;
              const msgMySl =
                FTextWInDicator +
                `\n <${this.sH_Service.imageHostUrl}/slack/slack-image/${postTo5m.files?.[0].id}|5m-slackImage>  ${imageWEB}`;
              await webhooksService.Post2MySlack(msgMySl, ticker,timeframes[0]);

              if (tsNCh) {
                // replay to btn-watch ts
                await webhooksService.reply_SLack(
                  tsNCh.channel,
                  tsNCh.ts,
                  text_15min + imageWEB,
                );
              } else {
                const blockre = webhooksService.getSlBlock(
                  ticker,
                  'accessory_full_watchlist',
                  ticker,
                );
                await webhooksService.reply_SLack(
                  SL_Channel_BIG_VOL,
                  messageTs,
                  'withBlock',
                  blockre,
                );
              }
            }
          } else {
            // test only and no need 15 to run
            const pathSym =
              `${SL_Channel_BIG_VOL}-5MIN/${ticker}`.toUpperCase();
            const msgN_imageWEB = `${FTextWInDicator}\n<${this.sH_Service.stockMk000}/capture-target/${pathSym}|prodUrl>`;
            await webhooksService.Post2MySlack(msgN_imageWEB, ticker,timeframes[0]);
            const postToCSLRE = await webhooksService.sendSlackNotificationVN(
              timeframes[0],
              [ticker],
              data_5min[data_5min.length - 1],
              SL_Channel_BIG_VOL,
              msgN_imageWEB,
            );
          }

          // const postToCSLRE  = await webhooksService.getImageN_PSlack_Forex_Crypto(
          //   data_5min,
          //   ticker,
          //   SL_Channel_BIG_VOL,
          //   `*${`BIG_🟡🟡_VOL`}*`+`\n${FTextWInDicator} \n`,
          //   timeframes[0],
          //  );

          // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
          // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
          // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
        }
      } else if (text_5min.includes('AB_MA50')) {
        let nextText = 'PREPARE_TO_BUY_50:';
        if (text_5min.includes('AB_MA50AB_MA120AB_MA200AB_MA300')) {
          nextText = 'SSBUY_MORE_300:';
        } else if (text_5min.includes('AB_MA50AB_MA120AB_MA200')) {
          nextText = 'BUY_MORE_MORE_200:';
        } else if (text_5min.includes('AB_MA50AB_MA120')) {
          nextText = 'BUY_MORE_120:';
        }
        const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
          data_5min,
          ticker,
          SL_Channel_AB_MA50,
          `*${nextText}*` + `\n${FullText} \n BUY_KEY`,
          timeframes[0],
        );
        // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
        // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
      } else if (text_5min.includes('macdCr_N')) {
        const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
          data_5min,
          ticker,
          SL_Channel_macdCr_N,
          `*macdCr_N_be_prepare*` + `\n${FullText} \n BUY_KEY`,
          timeframes[0],
        );
      } else if (!text_5min.includes('🔴')) {
        // } else if(text_5min.includes(checktext)){
        // send can buy: check macd call the
        const data_15min = await LocalPLWR.TwReveseNOAPI(ticker, timeframes[1]);
        const text_15min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
          ticker,
          timeframes[1],
          data_15min,
        );
        FullText += `${text_15min}\n`;
        const inWt =
          DataSymbols.watchlist.includes(ticker) &&
          (text_15min.includes('BUYY🟢🟢') || text_15min.includes('AB🟢🟢'));
        if (inWt) {
          // sent with good to buy check macd 0.1<0.6
          const data_30min = await LocalPLWR.TwReveseNOAPI(
            ticker,
            timeframes[2],
          );
          const text_30min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
            ticker,
            timeframes[2],
            data_30min,
          );
          FullText += `${text_30min}\n`;
          if (
            text_30min.includes('BUYY🟢🟢') ||
            text_30min.includes('AB🟢🟢')
          ) {
            // sent with good to buy check macd 0.1<0.6
            const data_1hour = await LocalPLWR.TwReveseNOAPI(
              ticker,
              timeframes[3],
            );
            const text_1hour = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
              ticker,
              timeframes[3],
              data_1hour,
            );
            FullText += `${text_1hour}\n`;
            // if(!FullText.includes('🔴')){
            if (!text_15min.includes('🔴') && !text_5min.includes('🔴')) {
              const allGreen = FullText.includes('🔴')
                ? '5_15_allgreen'
                : 'ALLGREEN_BE_CAREFULL_FORST';
              const postToCSLRE =
                await webhooksService.getImageN_PSlack_Forex_Crypto(
                  data_5min,
                  ticker,
                  SL_Channel_ALL_GREEN,
                  `*${allGreen}*` + `\n${FullText} \n BUY_KEY`,
                  timeframes[0],
                );

              // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
              // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
              // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
              if (text_15min.includes(checktext)) {
                await webhooksService.addReaction_SLack(
                  postToCSLRE.channel,
                  postToCSLRE.ts,
                  'heart',
                );
                if (text_1hour.includes(checktext)) {
                  await webhooksService.addReaction_SLack(
                    postToCSLRE.channel,
                    postToCSLRE.ts,
                    'cold_face',
                  );
                }
              } else if (
                text_30min.includes('macdCr_N') ||
                text_15min.includes('macdCr_N')
              ) {
                await webhooksService.addReaction_SLack(
                  postToCSLRE.channel,
                  postToCSLRE.ts,
                  'b',
                );
              }
              return;
            } else if (
              text_30min.includes('BUYY🟢🟢') ||
              text_30min.includes('AB🟢🟢')
            ) {
              // sent with good to buy check macd 0.1<0.6
              // send to watchlist
              const postToCSLRE =
                await webhooksService.getImageN_PSlack_Forex_Crypto(
                  data_5min,
                  ticker,
                  SL_Channel_WATCH,
                  `*5_allgreen_30BOrAb*` + `\n${FullText} \n BUY_KEY`,
                  timeframes[0],
                );
              // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
              // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
              // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
              if (text_15min.includes(checktext)) {
                await webhooksService.addReaction_SLack(
                  postToCSLRE.channel,
                  postToCSLRE.ts,
                  'heart',
                );
                if (text_1hour.includes(checktext)) {
                  await webhooksService.addReaction_SLack(
                    postToCSLRE.channel,
                    postToCSLRE.ts,
                    'cold_face',
                  );
                }
              } else if (
                text_30min.includes('macdCr_N') ||
                text_15min.includes('macdCr_N')
              ) {
                await webhooksService.addReaction_SLack(
                  postToCSLRE.channel,
                  postToCSLRE.ts,
                  'b',
                );
              }
              return;
            } else {
              console.log('stop at 15:5_allgreen_15_red');
              // buy earlly if
              if (MACDP && closeCrosMA50) {
                const postToCSLRE =
                  await webhooksService.getImageN_PSlack_Forex_Crypto(
                    data_5min,
                    ticker,
                    SL_Channel_EARLY_CHECK,
                    `*5_allgreen_15_red_ab50*` + `\n${FullText} \n BUY_KEY`,
                    timeframes[0],
                  );
                // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
              } else if (MACDP && closeCrosMA200) {
                // data_5min[data_5min.length-1],
                const postToCSLRE =
                  await webhooksService.getImageN_PSlack_Forex_Crypto(
                    data_5min,
                    ticker,
                    SL_Channel_EARLY_CHECK,
                    `*5_allgreen_15_red_ab200*` + `\n${FullText} \n BUY_KEY`,
                    timeframes[0],
                  );
                // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
                // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
                // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
              }
              return;
            }
          } else {
            console.log('stop at 30:5_allgreen_30_red');
            // buy earlly if
            if (MACDP && closeCrosMA200) {
              const postToCSLRE =
                await webhooksService.getImageN_PSlack_Forex_Crypto(
                  data_5min,
                  ticker,
                  SL_Channel_EARLY_CHECK,
                  `*5_allgreen_ab200_30_red*` + `\n${FullText} \n BUY_KEY`,
                  timeframes[0],
                );
              // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
              // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
              // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
            } else if (MACDP) {
              const postToCSLRE =
                await webhooksService.getImageN_PSlack_Forex_Crypto(
                  data_5min,
                  ticker,
                  SL_Channel_EARLY_CHECK,
                  `*5_allgreen_30_red*` + `\n${FullText} \n BUY_KEY`,
                  timeframes[0],
                );
              // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
              // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
              // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
            }
            return;
          }
        } else if (text_15min.includes('macdCr_N')) {
          const postToCSLRE =
            await webhooksService.getImageN_PSlack_Forex_Crypto(
              data_5min,
              ticker,
              SL_Channel_MACDCR_BL_OT,
              `*15_macdCr_N*` + `\n${FullText} \n BUY_KEY`,
              timeframes[0],
            );
          // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
          // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
          // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
        } else {
          console.log('stop at 15: 5_allgreen');
          // buy earlly if
          const last5min = data_5min[data_5min.length - 1];
          const MACDP = last5min.divergence > 0;
          const closeCrosMA50 =
            last5min.close > last5min.MA50 &&
            data_5min[data_5min.length - 2].close <
              data_5min[data_5min.length - 2].MA50;
          const closeCrosMA200 =
            last5min.close > last5min.MA200 &&
            data_5min[data_5min.length - 2].close <
              data_5min[data_5min.length - 2].MA200;
          if (MACDP && closeCrosMA200) {
            const postToCSLRE =
              await webhooksService.getImageN_PSlack_Forex_Crypto(
                data_5min,
                ticker,
                SL_Channel_EARLY_CHECK,
                `*5_allgreen_MA200*` + `\n${FullText} \n BUY_KEY`,
                timeframes[0],
              );
            // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
            // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
            // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
          } else if (MACDP) {
            const postToCSLRE =
              await webhooksService.getImageN_PSlack_Forex_Crypto(
                data_5min,
                ticker,
                SL_Channel_EARLY_CHECK,
                `*5_allgreen_MACDP*` + `\n${FullText} \n BUY_KEY`,
                timeframes[0],
              );
            // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
            // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
            // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
          }
          return;
        }
      } else if (!text_5min.includes('🟢')) {
        const data_1hour = await LocalPLWR.TwReveseNOAPI(ticker, timeframes[3]);
        const text_1hour = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
          ticker,
          timeframes[3],
          data_1hour,
        );
        FullText += `${text_1hour}\n`;
        if (!text_1hour.includes('🟢')) {
          const data_30min = await LocalPLWR.TwReveseNOAPI(
            ticker,
            timeframes[2],
          );
          const text_30min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
            ticker,
            timeframes[2],
            data_30min,
          );
          FullText += `${text_30min}\n`;
          let displaytext = '5_15_all_red';
          if (!text_30min.includes('🟢')) {
            const data_15min = await LocalPLWR.TwReveseNOAPI(
              ticker,
              timeframes[1],
            );
            const text_15min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
              ticker,
              timeframes[1],
              data_15min,
            );
            FullText += `${text_15min}\n`;
            if (!text_15min.includes('🟢')) {
              const postToCSLRE =
                await webhooksService.getImageN_PSlack_Forex_Crypto(
                  data_5min,
                  ticker,
                  SL_Channel_ALL_RED,
                  `*${displaytext}*` + `\n${FullText} \n SELL_KEY`,
                  timeframes[0],
                );
            }
          }
        } else {
          console.log('stop at 5', FullText);
          return;
        }
      }
    } catch (error) {
      console.log(514, error);
      return await webhooksService.sendDiscord(
        FullText,
        ticker,
        last5min,
        'MA_AB_50_100',
        data_5min,
      );
    }
  }

  async secondCheck(
    ticker: string,
    data_5min,
    timeframe: string, // timeframe
    webhooksService,
    Channels_4SL: string, // array
    mySl_channel: string,
    apiCalling = '*Tiingo_US*\n ',
  ) {
    let FullText = '';
    const text_5min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
      ticker,
      timeframe,
      data_5min,
    );
    FullText += `${apiCalling}${text_5min}\n`;
    await this.BUY_SELL_CHECKING(
      data_5min,
      ticker,
      timeframe,
      Channels_4SL,
      'GnOdxmYG7NSyGQ6AB0QB',
      webhooksService,
    );
    if (
      text_5min.includes('BIG_🟡🟡_VOL') &&
      text_5min.includes('bar_🟢_green')
    ) {
      if (true) {
        const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
          data_5min,
          ticker,
          Channels_4SL,
          mySl_channel,
          `*${`BIG_🟡🟡_VOL BUY_KEY`}*` + `\n${FullText} \n`,
          timeframe,
        );

        // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
        // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
        // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
      }
      return true;
    } else if (text_5min.includes('AB_MA50')) {
      let nextText = 'PREPARE_TO_BUY_50:';
      if (text_5min.includes('AB_MA50AB_MA120AB_MA200AB_MA300')) {
        nextText = 'SSBUY_MORE_300:';
      } else if (text_5min.includes('AB_MA50AB_MA120AB_MA200')) {
        nextText = 'BUY_MORE_MORE_200:';
      } else if (text_5min.includes('AB_MA50AB_MA120')) {
        nextText = 'BUY_MORE_120:';
      }
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data_5min,
        ticker,
        Channels_4SL,
        mySl_channel,
        `*${nextText}*` + `\n${FullText} \n BUY_KEY`,
        timeframe,
      );
      // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
      // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
      return true;
    } else if (text_5min.includes('macdCr_N')) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data_5min,
        ticker,
        Channels_4SL,
        mySl_channel,
        `*macdCr_N_be_prepare*` + `\n${FullText} \n BUY_KEY`,
        timeframe,
      );
      return true;
    } else if (!text_5min.includes('🔴')) {
      console.log('stop at 15: 5_allgreen');
      // buy earlly if
      const last5min = data_5min[data_5min.length - 1];
      const MACDP = last5min.divergence > 0;
      const closeCrosMA50 =
        last5min.close > last5min.MA50 &&
        data_5min[data_5min.length - 2].close <
          data_5min[data_5min.length - 2].MA50;
      const closeCrosMA200 =
        last5min.close > last5min.MA200 &&
        data_5min[data_5min.length - 2].close <
          data_5min[data_5min.length - 2].MA200;
      if (MACDP && closeCrosMA200) {
        const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
          data_5min,
          ticker,
          Channels_4SL,
          mySl_channel,
          `*5_allgreen_MA200*` + `\n${FullText} \n BUY_KEY`,
          timeframe,
        );
        // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
        // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
        // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
        return true;
      } else if (MACDP) {
        const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
          data_5min,
          ticker,
          Channels_4SL,
          mySl_channel,
          `*5_allgreen_MACDP*` + `\n${FullText} \n BUY_KEY`,
          timeframe,
        );
        // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
        // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
        // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'withBlock',blockre)
        return true;
      }
      return this.compareAndSend1hour(
        data_5min,
        ticker,
        timeframe,
        Channels_4SL,
        mySl_channel,
        webhooksService,
      );
    } else if (!text_5min.includes('🟢')) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data_5min,
        ticker,
        Channels_4SL,
        mySl_channel,
        `*ALL_RED TIME*` + `\n${FullText} \n SELL_KEY`,
        timeframe,
      );
    } else {
      console.log('stop at 5', FullText);
      return this.compareAndSend1hour(
        data_5min,
        ticker,
        timeframe,
        Channels_4SL,
        mySl_channel,
        webhooksService,
      );
    }
  }

  async compareAndSend1hour(
    data,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
    webhooksService,
  ) {
    const text_data = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
      ticker,
      timeframe,
      data,
    );
    const lastdata = data[data.length - 1];
    const Secondlastdata = data[data.length - 2];
    const Over200NUpBuy = await this.sH_Service.Over200NUpBuy(
      lastdata,
      Secondlastdata,
    );
    if (Over200NUpBuy) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data,
        ticker,
        B_Channel,
        HT_Channel,
        `BUY_KEY BlMA200_MA20_MA50_MA100_BUY-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data}`,
        timeframe,
      );
      return;
    }
    const macdCrossAB_BL0 = await this.sH_Service.macdCrossAB_BL0(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossAB_BL0) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data,
        ticker,
        B_Channel,
        HT_Channel,
        `BUY_KEY macdCrossAB_BL0-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data}`,
        timeframe,
      );
      return;
    }

    const priceAbMA200BUY = await this.sH_Service.priceAbMA200BUY(
      lastdata,
      Secondlastdata,
    );
    if (priceAbMA200BUY) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data,
        ticker,
        B_Channel,
        HT_Channel,
        `BUY_KEY priceAbMA200BUY-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data}`,
        timeframe,
      );
      return;
    }

    const priceBlMA200SELL = await this.sH_Service.priceBlMA200SELL(
      lastdata,
      Secondlastdata,
    );
    if (priceBlMA200SELL) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data,
        ticker,
        B_Channel,
        HT_Channel,
        `SELLCRLLLL priceBlMA200SELL-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data} SELL_KEY`,
        timeframe,
      );
      return;
    }

    const macdCrossAB = await this.sH_Service.macdCrossAB(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossAB) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data,
        ticker,
        B_Channel,
        HT_Channel,
        `BUY_KEY macdCrossAB-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data}`,
        timeframe,
      );
      return;
    }
    const earlyBuyInRSI = await this.sH_Service.earlyBuyInRSI(
      lastdata,
      Secondlastdata,
    );
    if (earlyBuyInRSI) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data,
        ticker,
        B_Channel,
        HT_Channel,
        `BUY_KEY earlyBuyInRSI-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data}`,
        timeframe,
      );
      return;
    }
    const macdCrossBL = await this.sH_Service.macdCrossBL(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossBL) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data,
        ticker,
        B_Channel,
        HT_Channel,
        `SELLCRLLLL macdCrossBL-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data} SELL_KEY`,
        timeframe,
      );
      return;
    }
    const earlySellInRSI = await this.sH_Service.earlySellInRSI(
      lastdata,
      Secondlastdata,
    );
    if (earlySellInRSI) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data,
        ticker,
        B_Channel,
        HT_Channel,
        `SELLCRLLLL earlySellInRSI-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data} SELL_KEY`,
        timeframe,
      );
      return;
    }

    const Under200NDownSell = await this.sH_Service.Under200NDownSell(
      lastdata,
      Secondlastdata,
    );
    if (Under200NDownSell) {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data,
        ticker,
        B_Channel,
        HT_Channel,
        `SELLCRLLLL Under200NDownSell-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data} SELL_KEY`,
        timeframe,
      );
      return;
    }

    if (timeframe === '4h' || timeframe === '1day') {
      const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        data,
        ticker,
        B_Channel,
        HT_Channel,
        `JUST WATCH_ME-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data}`,
        timeframe,
      );
      return;
    }
  }


  async BUY_SELL_CHECKING(
    data,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
    webhooksService,
  ) {
    const text_data = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
      ticker,
      timeframe,
      data,
    );
    const lastdata = data[data.length - 1];
    const Secondlastdata = data[data.length - 2];
    const Th_lastdata = data[data.length - 3];
    const getMACross = (
      lastData: StockData,
      secondLastData: StockData,
      period: string
    ) => {
      if (
        lastData?.close > lastData[period] &&
        secondLastData?.close < secondLastData[period]
      ) {
        return 'CR_AB';
      }
    
      if (
        lastData?.close < lastData[period] &&
        secondLastData?.close > secondLastData[period]
      ) {
        return 'CR_BL';
      }
      if (
        lastData?.close > lastData[period] ){
        return 'AB';
      }
      if (
        lastData?.close < lastData[period] ){
        return 'BL';
      }
      return '';
    };
    const maPeriods = [50, 120, 200, 300];

    for (const period of maPeriods) {
      const ma = `MA${period}`;
    
      const cr12 = getMACross(lastdata, Secondlastdata, ma);
      const cr23 = getMACross(Secondlastdata, Th_lastdata, ma);
    
      if (cr12 === 'AB' && cr23 === 'CR_AB') {
        // BUY
        console.log(`BUY ${ma}`);
        const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
          data,
          `${ticker}-${timeframe}-${ma}`,
          B_Channel,
          HT_Channel,
          `*BUY-DEEEEEE ${ma}* \n
          ${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data} BUY_KEY`,
          timeframe,
        );
      } else if (cr12 === 'BL' && cr23 === 'CR_BL') {
        // SELL
        console.log(`SELL ${ma}`);
        const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
          data,
          `${ticker}-${timeframe}-${ma}`,
          B_Channel,
          HT_Channel,
          `*SELL-DEEEEEE ${ma}* \n-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data} SELL_KEY`,
          timeframe,
        );
      } else{
        //test data
        // const postToCSLRE = await webhooksService.getImageN_PSlack_Forex_Crypto(
        //   data,
        //   `${ticker}-${timeframe}-${ma}`,
        //   B_Channel,
        //   HT_Channel,
        //   `*SELL-DEEEEEE ${ma}* \n-${timeframe}-${lastdata?.close}-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}\n ${text_data}`,
        //   timeframe,
        // );
        // return false
      }
    }
  }
}
