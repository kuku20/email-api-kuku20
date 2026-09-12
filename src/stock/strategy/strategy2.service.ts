import { Injectable, Logger } from '@nestjs/common';
import { StockHelperService } from '../stockHelper.service';
import * as DataSymbols from '../dto';
@Injectable()
export class Stratery_2Service {
  constructor(private readonly sH_Service: StockHelperService) {}
  // async CHECKBULL_BEAR_processTickers

  async FristCheck(
    ticker: string,
    data_5min,
    timeframes: string[], // array [first_timeframe,second_timeframe]5min,15min,30min,1hour
    LocalPLWR,
    webhooksService,
    Channels_8_DC_Channel: string[], // array
    Channels_8_SL_Channel: string[], // array
    NotPostToSlack = false,
  ) {
    this.sH_Service.PostWebSlack = true;
    let FullText = '';
    const checktext = 'AB🟢🟢BUYY🟢🟢';
    const tsNCh =
      webhooksService.getTsBySymbol(ticker, this.sH_Service.watchlistSl_tss) ||
      webhooksService.getTsBySymbol(ticker, this.sH_Service.holdingSl_tss);
    const inWlist = DataSymbols.watchlist.includes(ticker);
    const SL_Short = this.sH_Service.INTRA_30M_SL_;

    const DC_Channel_BIG_VOL =
      Channels_8_DC_Channel[0] || (inWlist ? 'US_EARLY_15MIN' : 'US_15M_HT');
    const SL_Channel_BIG_VOL =
      Channels_8_SL_Channel[0] ||
      (inWlist ? SL_Short.MACDCR_50 : SL_Short.MACDCR_BL);

    const DC_Channel_AB_MA50 =
      Channels_8_DC_Channel[1] || (inWlist ? 'US_EARLY_5MIN' : 'US_5M_HT');
    const SL_Channel_AB_MA50 =
      Channels_8_SL_Channel[1] ||
      (inWlist ? SL_Short.MACDCR_100 : SL_Short.MACDCR_200);

    const DC_Channel_macdCr_N = Channels_8_DC_Channel[2] || 'EARLY_AB200';
    const SL_Channel_macdCr_N = Channels_8_SL_Channel[2] || SL_Short.MACDCR_BL;

    const DC_Channel_ALL_GREEN = Channels_8_DC_Channel[3] || 'US_ALL';
    const SL_Channel_ALL_GREEN = Channels_8_SL_Channel[3] || SL_Short.ALLGREEN;

    const DC_Channel_ALL_RED = Channels_8_DC_Channel[4] || 'MA_AB_50_100';
    const SL_Channel_ALL_RED = Channels_8_SL_Channel[4] || SL_Short.D_DOWN;

    const DC_Channel_WATCH = Channels_8_DC_Channel[5] || 'US_30M_BUY';
    const SL_Channel_WATCH = Channels_8_SL_Channel[5] || SL_Short.WATCH;

    const DC_Channel_EARLY_CHECK = Channels_8_DC_Channel[6] || 'USSTOCK_WATCH';
    const SL_Channel_EARLY_CHECK =
      Channels_8_SL_Channel[6] || SL_Short.EARLY_CHECK;

    const DC_Channel_MACDCR_BL_OT = Channels_8_DC_Channel[7] || 'US_30M_HT';
    const SL_Channel_MACDCR_BL_OT =
      Channels_8_SL_Channel[7] || SL_Short.MACDCR_BL_OT;

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
      FullText += `${text_15min}\n`;
      if (true) {
        const discodedata = await webhooksService.sendDiscord(
          '*BIG_🟡🟡_VOL*' + FullText,
          `${ticker}-ON-${timeframes[0]}-${'BIG_🟡🟡_VOL'}`,
          data_5min[data_5min.length - 1],
          DC_Channel_BIG_VOL,
          data_5min,
        );
        if (NotPostToSlack) {
          return true;
        }
        const imageUrl =
          discodedata?.embeds?.[0]?.image?.url ||
          (discodedata?.attachments ?? discodedata?.attachments?.first()?.url);
        const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
        FullText += `<${msgDiscord}|Discord-o6l-msg>`;
        const DC_channel_BV_15Min = `${DC_Channel_BIG_VOL}_15MIN`;
        if (discodedata && discodedata?.channel_id && imageUrl.length > 0) {
          // // console.log("image-5min,92-pass")
          const postToCSLRE = await webhooksService.sendSlackNotificationVN(
            timeframes[0],
            [ticker],
            data_5min[data_5min.length - 1],
            SL_Channel_BIG_VOL,
            `*BIG_🟡🟡_VOL*` + `\n${FullText} \n`,
            imageUrl,
          );
          const fileBuffer15m = await webhooksService.captureChart(
            data_15min,
            ticker,
            DC_channel_BV_15Min,
            text_15min,
          );
          if (fileBuffer15m) {
            // // console.log("image-15min,108-pass")
            const replyData_15 = await webhooksService.reply2_DC_Message(
              discodedata.channel_id,
              discodedata.id,
              text_15min,
              fileBuffer15m,
            );
            const replyImage = replyData_15.imageUrl;
            const msgDiscord_15m = `${this.sH_Service.DiscordMsg}/${replyData_15?.channelId}/${replyData_15?.id}`;
            if (replyImage) {
              if (discodedata.MySlackmsgId) {
                FullText += `<${msgDiscord_15m}|Discord-o6l-msg-2>|| <${imageUrl}|discordImage-5min> || <${replyImage}|discordImage-15min>`;
                await webhooksService.UpdateMySLack(
                  FullText,
                  ticker,
                  discodedata.MySlackmsgId,
                );
              }
              const chart15m = `<${replyImage}|15-Chart> \n`;
              await webhooksService.reply_SLack(
                postToCSLRE.postToCSLRE.channel,
                postToCSLRE.postToCSLRE.ts,
                chart15m,
              );
              if (tsNCh) {
                await webhooksService.reply_SLack(
                  tsNCh.channel,
                  tsNCh.ts,
                  text_15min +
                    ` || <${msgDiscord_15m}|Discord-o6l-msg-2> || <${replyImage}|discordImage-15min>`,
                );
              }
            } else {
              // post image to sier
              const sirvImage = await webhooksService.uploadImageTo_sirvService(
                fileBuffer15m,
              );
              const sirvImagemsg =
                FullText + `\n <${sirvImage.url}|sirvImage> `;
              FullText += `<${msgDiscord_15m}|Discord-o6l-msg-2>|| <${imageUrl}|discordImage-5min> || <${sirvImage}|sirvImage-15min>`;
              await webhooksService.UpdateMySLack(
                FullText,
                ticker,
                discodedata.MySlackmsgId,
              );
              const postToCSLRE = await webhooksService.sendSlackNotificationVN(
                timeframes[0],
                [ticker],
                data_5min[data_5min.length - 1],
                SL_Channel_BIG_VOL,
                `*BIG_🟡🟡_VOL*` + `\n${FullText} \n`,
                sirvImagemsg,
              );
            }
          } else {
            // 5min_image and 15min_weblink
            // // console.log("15min_weblink,144-pass")
            const Web_imageUrl_15min = `${
              this.sH_Service.stockMk000
            }/capture-target/${DC_channel_BV_15Min}/${ticker.toUpperCase()}`;
            const dc_15_img_web = `**[img_web](${Web_imageUrl_15min})**`;
            const replyData_15 = await webhooksService.reply2_DC_Message(
              discodedata.channel_id,
              discodedata.id,
              dc_15_img_web,
            );
            const msgDiscord_15m = `${this.sH_Service.DiscordMsg}/${replyData_15?.channelId}/${replyData_15?.id}`;
            FullText += `<${Web_imageUrl_15min}|prodUrl>|| <${imageUrl}|discordImage-5min> `;
            await webhooksService.UpdateMySLack(
              FullText,
              ticker,
              discodedata.MySlackmsgId,
            );
            await webhooksService.reply_SLack(
              postToCSLRE.postToCSLRE.channel,
              postToCSLRE.postToCSLRE.ts,
              text_15min +
                ` || <${msgDiscord_15m}|Discord-o6l-msg-2> || <${Web_imageUrl_15min}|prodUrl>`,
            );
            if (tsNCh) {
              await webhooksService.reply_SLack(
                tsNCh.channel,
                tsNCh.ts,
                text_15min +
                  ` || <${msgDiscord_15m}|Discord-o6l-msg-2> || <${Web_imageUrl_15min}|prodUrl>`,
              );
            }
          }
        } else {
          // // console.log("NO_IMAGE: 15min_weblink,156-pass")
          // no 5min-image |post to data-15min
          const slicedData = [...data_15min]
            .sort(
              (a: any, b: any) =>
                new Date(a.date).getTime() - new Date(b.date).getTime(),
            )
            .slice(-200);
          const pathSym = `${DC_channel_BV_15Min}/${ticker}`.toUpperCase();
          await webhooksService.FireBaseApi(
            'put',
            `stock-data/${pathSym}.json`,
            slicedData,
          );

          const Web_imageUrl_5min = `${
            this.sH_Service.stockMk000
          }/capture-target/${DC_Channel_BIG_VOL}/${ticker.toUpperCase()}`;
          const dc_15_img_web = `**[img_web](${Web_imageUrl_5min})**`;
          const replyData_15 = await webhooksService.reply2_DC_Message(
            discodedata.channel_id,
            discodedata.id,
            dc_15_img_web,
          );
          const msgDiscord_15m = `${this.sH_Service.DiscordMsg}/${replyData_15?.channelId}/${replyData_15?.id}`;
          const Web_imageUrl_5min_text = `<${Web_imageUrl_5min}|prodUrl>`;
          const postToCSLRE = await webhooksService.sendSlackNotificationVN(
            timeframes[0],
            [ticker],
            data_5min[data_5min.length - 1],
            SL_Channel_BIG_VOL,
            `*BIG_🟡🟡_VOL*` + `\n${FullText} \n${Web_imageUrl_5min_text}`,
          );
          const Web_imageUrl_15min = `${
            this.sH_Service.stockMk000
          }/capture-target/${DC_channel_BV_15Min}/${ticker.toUpperCase()}`;
          FullText += `${Web_imageUrl_5min_text} || <${msgDiscord_15m}|Discord-o6l-msg-2> || <${Web_imageUrl_15min}|prodUrl>`;
          // // console.log("discodedata-186",discodedata?.MySlackmsgId)
          // // console.log("FullText-187",FullText)
          await webhooksService.UpdateMySLack(
            FullText,
            ticker,
            discodedata.MySlackmsgId,
          );
          await webhooksService.reply_SLack(
            postToCSLRE.postToCSLRE.channel,
            postToCSLRE.postToCSLRE.ts,
            text_15min +
              ` || <${msgDiscord_15m}|Discord-o6l-msg-2> || <${Web_imageUrl_15min}|prodUrl>`,
          );
          if (tsNCh) {
            await webhooksService.reply_SLack(
              tsNCh.channel,
              tsNCh.ts,
              text_15min +
                ` || <${msgDiscord_15m}|Discord-o6l-msg-2> || <${Web_imageUrl_15min}|prodUrl>`,
            );
          }
        }

        // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
        // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
        // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
        return true;
      } else {
        // 5min fails to post image return webImageUrl
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
      const discodedata = await webhooksService.sendDiscord(
        `**${nextText}**` + FullText,
        `${ticker}-ON-${timeframes[0]}-${'macdCrossAB-'}`,
        data_5min[data_5min.length - 1],
        DC_Channel_AB_MA50,
        data_5min,
      ); //       imageUrl = sentMessage.embeds[0]?.image?.url || sentMessage.attachments.first()?.url;
      if (NotPostToSlack) {
        return true;
      }
      const imageUrl =
        discodedata?.embeds?.[0]?.image?.url ||
        (discodedata?.attachments ?? discodedata?.attachments?.first()?.url);
      if (discodedata && discodedata?.channel_id) {
        const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
        FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
      }
      const postToCSLRE = await webhooksService.sendSlackNotificationVN(
        timeframes[0],
        [ticker],
        data_5min[data_5min.length - 1],
        SL_Channel_AB_MA50,
        `*${nextText}*` + `\n${FullText} \n`,
        imageUrl,
      );
      // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
      // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
      return true;
    } else if (text_5min.includes('macdCr_N')) {
      const discodedata = await webhooksService.sendDiscord(
        `**macdCr_N_be_prepare**` + FullText,
        `${ticker}-ON-${timeframes[0]}-${'macdCr_N_be_prepare'}`,
        data_5min[data_5min.length - 1],
        DC_Channel_macdCr_N,
        data_5min,
      );
      if (NotPostToSlack) {
        return true;
      }
      const imageUrl =
        discodedata?.embeds?.[0]?.image?.url ||
        (discodedata?.attachments ?? discodedata?.attachments?.first()?.url);
      if (discodedata && discodedata?.channel_id) {
        const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
        FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
      }
      const postToCSLRE = await webhooksService.sendSlackNotificationVN(
        timeframes[0],
        [ticker],
        data_5min[data_5min.length - 1],
        SL_Channel_macdCr_N,
        `*macdCr_N_be_prepare*` + `\n${FullText} \n`,
        imageUrl,
      );
      return true;
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
        inWlist &&
        (text_15min.includes('BUYY🟢🟢') || text_15min.includes('AB🟢🟢'));
      if (inWt) {
        // sent with good to buy check macd 0.1<0.6
        const data_30min = await LocalPLWR.TwReveseNOAPI(ticker, timeframes[2]);
        const text_30min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
          ticker,
          timeframes[2],
          data_30min,
        );
        FullText += `${text_30min}\n`;
        if (text_30min.includes('BUYY🟢🟢') || text_30min.includes('AB🟢🟢')) {
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
            const discodedata = await webhooksService.sendDiscord(
              allGreen + '\n' + FullText,
              `${ticker}-ON-${timeframes[0]}-${allGreen}`,
              data_5min[data_5min.length - 1],
              DC_Channel_ALL_GREEN,
              data_5min,
            );
            if (NotPostToSlack) {
              return true;
            }
            const imageUrl =
              discodedata?.embeds?.[0]?.image?.url ||
              (discodedata?.attachments ??
                discodedata?.attachments?.first()?.url);
            if (discodedata && discodedata?.channel_id) {
              const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
              FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
            }
            const postToCSLRE = await webhooksService.sendSlackNotificationVN(
              timeframes[0],
              [ticker],
              data_5min[data_5min.length - 1],
              SL_Channel_ALL_GREEN,
              `*${allGreen}*` + `\n${FullText} \n`,
              imageUrl,
            );
            // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
            // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
            // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
            if (text_15min.includes(checktext)) {
              await webhooksService.addReaction_SLack(
                postToCSLRE.postToCSLRE.channel,
                postToCSLRE.postToCSLRE.ts,
                'heart',
              );
              if (text_1hour.includes(checktext)) {
                await webhooksService.addReaction_SLack(
                  postToCSLRE.postToCSLRE.channel,
                  postToCSLRE.postToCSLRE.ts,
                  'cold_face',
                );
              }
            } else if (
              text_30min.includes('macdCr_N') ||
              text_15min.includes('macdCr_N')
            ) {
              await webhooksService.addReaction_SLack(
                postToCSLRE.postToCSLRE.channel,
                postToCSLRE.postToCSLRE.ts,
                'b',
              );
            }
            return true;
          } else if (
            text_30min.includes('BUYY🟢🟢') ||
            text_30min.includes('AB🟢🟢')
          ) {
            // sent with good to buy check macd 0.1<0.6
            // send to watchlist
            const discodedata = await webhooksService.sendDiscord(
              '*5_allgreen_30BOrAb*' + FullText,
              `${ticker}-ON-${timeframes[0]}-${'5_allgreen_30BOrAb'}`,
              data_5min[data_5min.length - 1],
              DC_Channel_WATCH,
              data_5min,
            );
            if (NotPostToSlack) {
              return true;
            }
            const imageUrl =
              discodedata?.embeds?.[0]?.image?.url ||
              (discodedata?.attachments ??
                discodedata?.attachments?.first()?.url);
            if (discodedata && discodedata?.channel_id) {
              const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
              FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
            }
            const postToCSLRE = await webhooksService.sendSlackNotificationVN(
              timeframes[0],
              [ticker],
              data_5min[data_5min.length - 1],
              SL_Channel_WATCH,
              `*5_allgreen_30BOrAb*` + `\n${FullText} \n`,
              imageUrl,
            );
            // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
            // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
            // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
            if (text_15min.includes(checktext)) {
              await webhooksService.addReaction_SLack(
                postToCSLRE.postToCSLRE.channel,
                postToCSLRE.postToCSLRE.ts,
                'heart',
              );
              if (text_1hour.includes(checktext)) {
                await webhooksService.addReaction_SLack(
                  postToCSLRE.postToCSLRE.channel,
                  postToCSLRE.postToCSLRE.ts,
                  'cold_face',
                );
              }
            } else if (
              text_30min.includes('macdCr_N') ||
              text_15min.includes('macdCr_N')
            ) {
              await webhooksService.addReaction_SLack(
                postToCSLRE.postToCSLRE.channel,
                postToCSLRE.postToCSLRE.ts,
                'b',
              );
            }
            return true;
          } else {
            // // console.log('stop at 15:5_allgreen_15_red');
            // buy earlly if
            if (MACDP && closeCrosMA50) {
              const discodedata = await webhooksService.sendDiscord(
                '*5_allgreen_15_red_ab50*' + FullText,
                `${ticker}-ON-${timeframes[0]}-${'5_allgreen_15_red_ab50'}`,
                data_5min[data_5min.length - 1],
                DC_Channel_EARLY_CHECK,
                data_5min,
              );
              if (NotPostToSlack) {
                return true;
              }
              const imageUrl =
                discodedata?.embeds?.[0]?.image?.url ||
                (discodedata?.attachments ??
                  discodedata?.attachments?.first()?.url);
              if (discodedata && discodedata?.channel_id) {
                const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
                FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
              }
              const postToCSLRE = await webhooksService.sendSlackNotificationVN(
                timeframes[0],
                [ticker],
                data_5min[data_5min.length - 1],
                SL_Channel_EARLY_CHECK,
                `*5_allgreen_15_red_ab50*` + `\n${FullText} \n`,
                imageUrl,
              );
              // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
              // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
              // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
              return true;
            } else if (MACDP && closeCrosMA200) {
              const discodedata = await webhooksService.sendDiscord(
                '*5_allgreen_15_red_ab200*' + FullText,
                `${ticker}-ON-${timeframes[0]}-${'5_allgreen_15_red_ab200'}`,
                data_5min[data_5min.length - 1],
                DC_Channel_EARLY_CHECK,
                data_5min,
              );
              if (NotPostToSlack) {
                return true;
              }
              const imageUrl =
                discodedata?.embeds?.[0]?.image?.url ||
                (discodedata?.attachments ??
                  discodedata?.attachments?.first()?.url);
              if (discodedata && discodedata?.channel_id) {
                const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
                FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
              }
              const postToCSLRE = await webhooksService.sendSlackNotificationVN(
                timeframes[0],
                [ticker],
                data_5min[data_5min.length - 1],
                SL_Channel_EARLY_CHECK,
                `*5_allgreen_15_red_ab200*` + `\n${FullText} \n`,
                imageUrl,
              );
              // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
              // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
              // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
              return true;
            } else return false;
          }
        } else {
          // // console.log('stop at 30:5_allgreen_30_red');
          // buy earlly if
          if (MACDP && closeCrosMA200) {
            const discodedata = await webhooksService.sendDiscord(
              '*5_allgreen_ab200_30_red*' + FullText,
              `${ticker}-ON-${timeframes[0]}-${'5_allgreen_ab200_30_red'}`,
              data_5min[data_5min.length - 1],
              DC_Channel_EARLY_CHECK,
              data_5min,
            );
            if (NotPostToSlack) {
              return true;
            }
            const imageUrl =
              discodedata?.embeds?.[0]?.image?.url ||
              (discodedata?.attachments ??
                discodedata?.attachments?.first()?.url);
            if (discodedata && discodedata?.channel_id) {
              const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
              FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
            }
            const postToCSLRE = await webhooksService.sendSlackNotificationVN(
              timeframes[0],
              [ticker],
              data_5min[data_5min.length - 1],
              SL_Channel_EARLY_CHECK,
              `*5_allgreen_ab200_30_red*` + `\n${FullText} \n`,
              imageUrl,
            );
            // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
            // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
            // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
            return true;
          } else if (MACDP) {
            const discodedata = await webhooksService.sendDiscord(
              '*5_allgreen_30_red*' + FullText,
              `${ticker}-ON-${timeframes[0]}-${'5_allgreen_30_red'}`,
              data_5min[data_5min.length - 1],
              DC_Channel_EARLY_CHECK,
              data_5min,
            );
            if (NotPostToSlack) {
              return true;
            }
            const imageUrl =
              discodedata?.embeds?.[0]?.image?.url ||
              (discodedata?.attachments ??
                discodedata?.attachments?.first()?.url);
            if (discodedata && discodedata?.channel_id) {
              const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
              FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
            }
            const postToCSLRE = await webhooksService.sendSlackNotificationVN(
              timeframes[0],
              [ticker],
              data_5min[data_5min.length - 1],
              SL_Channel_EARLY_CHECK,
              `*5_allgreen_30_red*` + `\n${FullText} \n`,
              imageUrl,
            );
            // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
            // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
            // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
            return true;
          } else return false;
        }
        return false;
      } else if (text_15min.includes('macdCr_N')) {
        const discodedata = await webhooksService.sendDiscord(
          '*15_macdCr_N*' + FullText,
          `${ticker}-ON-${timeframes[0]}-${'15_macdCr_N'}`,
          data_5min[data_5min.length - 1],
          DC_Channel_MACDCR_BL_OT,
          data_5min,
        );
        if (NotPostToSlack) {
          return true;
        }
        const imageUrl =
          discodedata?.embeds?.[0]?.image?.url ||
          (discodedata?.attachments ?? discodedata?.attachments?.first()?.url);
        if (discodedata && discodedata?.channel_id) {
          const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
          FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
        }
        const postToCSLRE = await webhooksService.sendSlackNotificationVN(
          timeframes[0],
          [ticker],
          data_5min[data_5min.length - 1],
          SL_Channel_MACDCR_BL_OT,
          `*15_macdCr_N*` + `\n${FullText} \n`,
          imageUrl,
        );
        // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
        // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
        // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
        return true;
      } else {
        // // console.log('stop at 15: 5_allgreen');
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
          const discodedata = await webhooksService.sendDiscord(
            '*5_allgreen_MA200*' + FullText,
            `${ticker}-ON-${timeframes[0]}-${'5_allgreen_MA200'}`,
            data_5min[data_5min.length - 1],
            DC_Channel_EARLY_CHECK,
            data_5min,
          );
          if (NotPostToSlack) {
            return true;
          }
          const imageUrl =
            discodedata?.embeds?.[0]?.image?.url ||
            (discodedata?.attachments ??
              discodedata?.attachments?.first()?.url);
          if (discodedata && discodedata?.channel_id) {
            const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
            FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
          }
          const postToCSLRE = await webhooksService.sendSlackNotificationVN(
            timeframes[0],
            [ticker],
            data_5min[data_5min.length - 1],
            SL_Channel_EARLY_CHECK,
            `*5_allgreen_MA200*` + `\n${FullText} \n`,
            imageUrl,
          );
          // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
          // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
          // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
          return true;
        } else if (MACDP) {
          const discodedata = await webhooksService.sendDiscord(
            '*5_allgreen_MACDP*' + FullText,
            `${ticker}-ON-${timeframes[0]}-${'5_allgreen_MACDP'}`,
            data_5min[data_5min.length - 1],
            DC_Channel_EARLY_CHECK,
            data_5min,
          );
          if (NotPostToSlack) {
            return true;
          }
          const imageUrl =
            discodedata?.embeds?.[0]?.image?.url ||
            (discodedata?.attachments ??
              discodedata?.attachments?.first()?.url);
          if (discodedata && discodedata?.channel_id) {
            const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
            FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
          }
          const postToCSLRE = await webhooksService.sendSlackNotificationVN(
            timeframes[0],
            [ticker],
            data_5min[data_5min.length - 1],
            SL_Channel_EARLY_CHECK,
            `*5_allgreen_MACDP*` + `\n${FullText} \n`,
            imageUrl,
          );
          // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
          // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
          // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
          return true;
        }
        return false;
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
        const data_30min = await LocalPLWR.TwReveseNOAPI(ticker, timeframes[2]);
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
            const discodedata = await webhooksService.sendDiscord(
              displaytext + '\n' + FullText,
              `${ticker}-ON-${timeframes[0]}-${displaytext}`,
              data_5min[data_5min.length - 1],
              DC_Channel_ALL_RED,
              data_5min,
            );
            if (NotPostToSlack) {
              return true;
            }
            const imageUrl =
              discodedata?.embeds?.[0]?.image?.url ||
              (discodedata?.attachments ??
                discodedata?.attachments?.first()?.url);
            if (discodedata && discodedata?.channel_id) {
              const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
              FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
            }
            const postToCSLRE = await webhooksService.sendSlackNotificationVN(
              timeframes[0],
              [ticker],
              data_5min[data_5min.length - 1],
              SL_Channel_ALL_RED,
              `*${displaytext}*` + `\n${FullText} \n`,
              imageUrl,
            );
            return true;
          }
        }
        return false;
      }
    } else {
      // // console.log('stop at 5', FullText);
      return false;
    }
    return false;
  }

  async secondCheck(
    ticker: string,
    data_5min,
    timeframe: string, // timeframe
    webhooksService,
    Channels_4_DC_Channel: string[], // array
    Channels_4_SL_Channel: string[], // array
    NotPostToSlack = false,
    apiCalling = '*Tiingo_US*\n ',
  ) {
    let FullText = '';
    const inWlist = DataSymbols.watchlist.includes(ticker);
    const SL_Short = this.sH_Service.INTRA_30M_SL_;

    const DC_Channel_BIG_VOL =
      Channels_4_DC_Channel[0] || (inWlist ? 'US_EARLY_15MIN' : 'US_15M_HT');
    const SL_Channel_BIG_VOL =
      Channels_4_SL_Channel[0] ||
      (inWlist ? SL_Short.MACDCR_50 : SL_Short.MACDCR_BL);

    const DC_Channel_AB_MA50 =
      Channels_4_DC_Channel[1] || (inWlist ? 'US_EARLY_5MIN' : 'US_5M_HT');
    const SL_Channel_AB_MA50 =
      Channels_4_SL_Channel[1] ||
      (inWlist ? SL_Short.MACDCR_100 : SL_Short.MACDCR_200);

    const DC_Channel_macdCr_N = Channels_4_DC_Channel[2] || 'EARLY_AB200';
    const SL_Channel_macdCr_N = Channels_4_SL_Channel[2] || SL_Short.MACDCR_BL;

    const DC_Channel_EARLY_CHECK = Channels_4_DC_Channel[3] || 'USSTOCK_WATCH';
    const SL_Channel_EARLY_CHECK =
      Channels_4_SL_Channel[3] || SL_Short.EARLY_CHECK;
    const text_5min = await this.sH_Service.CHECKBULL_BEAR_ReTurnText(
      ticker,
      timeframe,
      data_5min,
    );
    FullText += `${apiCalling}${text_5min}\n`;
    if (
      text_5min.includes('BIG_🟡🟡_VOL') &&
      text_5min.includes('bar_🟢_green')
    ) {
      if (true) {
        const discodedata = await webhooksService.sendDiscord(
          '*BIG_🟡🟡_VOL*' + FullText,
          `${ticker}-ON-${timeframe}-${'BIG_🟡🟡_VOL'}`,
          data_5min[data_5min.length - 1],
          DC_Channel_BIG_VOL,
          data_5min,
        );
        if (NotPostToSlack) {
          return true;
        }
        const imageUrl =
          discodedata?.embeds?.[0]?.image?.url ||
          (discodedata?.attachments ?? discodedata?.attachments?.first()?.url);
        if (discodedata && discodedata?.channel_id) {
          const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
          FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||

          const postToCSLRE = await webhooksService.sendSlackNotificationVN(
            timeframe,
            [ticker],
            data_5min[data_5min.length - 1],
            SL_Channel_BIG_VOL,
            `*BIG_🟡🟡_VOL*` + `\n${FullText} \n`,
            imageUrl,
          );
        } else {
          const postToCSLRE = await webhooksService.sendSlackNotificationVN(
            timeframe,
            [ticker],
            data_5min[data_5min.length - 1],
            SL_Channel_BIG_VOL,
            `*BIG_🟡🟡_VOL*` + `\n${FullText} \n`,
            imageUrl,
          );
        }
        return true;
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
      const discodedata = await webhooksService.sendDiscord(
        `**${nextText}**` + FullText,
        `${ticker}-ON-${timeframe}-${'macdCrossAB-'}`,
        data_5min[data_5min.length - 1],
        DC_Channel_AB_MA50,
        data_5min,
      ); //       imageUrl = sentMessage.embeds[0]?.image?.url || sentMessage.attachments.first()?.url;
      if (NotPostToSlack) {
        return true;
      }
      const imageUrl =
        discodedata?.embeds?.[0]?.image?.url ||
        (discodedata?.attachments ?? discodedata?.attachments?.first()?.url);
      if (discodedata && discodedata?.channel_id) {
        const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
        FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
      }
      const postToCSLRE = await webhooksService.sendSlackNotificationVN(
        timeframe,
        [ticker],
        data_5min[data_5min.length - 1],
        SL_Channel_AB_MA50,
        `*${nextText}*` + `\n${FullText} \n`,
        imageUrl,
      );
      return true;
    } else if (text_5min.includes('macdCr_N')) {
      const discodedata = await webhooksService.sendDiscord(
        `**macdCr_N_be_prepare**` + FullText,
        `${ticker}-ON-${timeframe}-${'macdCr_N_be_prepare'}`,
        data_5min[data_5min.length - 1],
        DC_Channel_macdCr_N,
        data_5min,
      );
      if (NotPostToSlack) {
        return true;
      }
      const imageUrl =
        discodedata?.embeds?.[0]?.image?.url ||
        (discodedata?.attachments ?? discodedata?.attachments?.first()?.url);
      if (discodedata && discodedata?.channel_id) {
        const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
        FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
      }
      const postToCSLRE = await webhooksService.sendSlackNotificationVN(
        timeframe,
        [ticker],
        data_5min[data_5min.length - 1],
        SL_Channel_macdCr_N,
        `*macdCr_N_be_prepare*` + `\n${FullText} \n`,
        imageUrl,
      );
      return true;
    } else if (!text_5min.includes('🔴')) {
      // // console.log('stop at 15: 5_allgreen');
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
        const discodedata = await webhooksService.sendDiscord(
          '*5_allgreen_MA200*' + FullText,
          `${ticker}-ON-${timeframe}-${'5_allgreen_MA200'}`,
          data_5min[data_5min.length - 1],
          DC_Channel_EARLY_CHECK,
          data_5min,
        );
        if (NotPostToSlack) {
          return true;
        }
        const imageUrl =
          discodedata?.embeds?.[0]?.image?.url ||
          (discodedata?.attachments ?? discodedata?.attachments?.first()?.url);
        if (discodedata && discodedata?.channel_id) {
          const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
          FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
        }
        const postToCSLRE = await webhooksService.sendSlackNotificationVN(
          timeframe,
          [ticker],
          data_5min[data_5min.length - 1],
          SL_Channel_EARLY_CHECK,
          `*5_allgreen_MA200*` + `\n${FullText} \n`,
          imageUrl,
        );
        // const blockre = webhooksService.getSlBlock(ticker,'accessory_full_watchlist',ticker)
        // // await webhooksService.reply_SLack(postToCSLRE.channel,postToCSLRE.ts,'postnone')
        // await webhooksService.reply_SLack(postToCSLRE.postToCSLRE.channel,postToCSLRE.postToCSLRE.ts,'withBlock',blockre)
        return true;
      } else if (MACDP) {
        const discodedata = await webhooksService.sendDiscord(
          '*5_allgreen_MACDP*' + FullText,
          `${ticker}-ON-${timeframe}-${'5_allgreen_MACDP'}`,
          data_5min[data_5min.length - 1],
          DC_Channel_EARLY_CHECK,
          data_5min,
        );
        if (NotPostToSlack) {
          return true;
        }
        const imageUrl =
          discodedata?.embeds?.[0]?.image?.url ||
          (discodedata?.attachments ?? discodedata?.attachments?.first()?.url);
        if (discodedata && discodedata?.channel_id) {
          const msgDiscord = `${this.sH_Service.DiscordMsg}/${discodedata?.channel_id}/${discodedata?.id}`;
          FullText += `<${msgDiscord}|Discord-o6l-msg>|| <${discodedata.WebsiteImageUrl}|prodUrl>`; // <${imageUrl}|Chart> ||
        }
        const postToCSLRE = await webhooksService.sendSlackNotificationVN(
          timeframe,
          [ticker],
          data_5min[data_5min.length - 1],
          SL_Channel_EARLY_CHECK,
          `*5_allgreen_MACDP*` + `\n${FullText} \n`,
          imageUrl,
        );
        return true;
      }
      return false;
    } else {
      // // console.log('stop at 5', FullText);
      return false;
    }
    return false;
  }
}
