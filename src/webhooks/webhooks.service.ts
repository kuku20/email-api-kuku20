import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AttachmentBuilder,EmbedBuilder, WebhookClient } from 'discord.js';
@Injectable()
export class WebhooksService {
  private webhookClient: WebhookClient;
  private WEBHOOKS_ENV: Record<string, string>;
  private WEBHOOKS_CN: Record<string, string>;
  private rsiChannels: string[];
  constructor(private readonly configService: ConfigService) {
     // Parse JSON from env vars
     this.WEBHOOKS_ENV = JSON.parse(
      this.configService.get<string>('WEBHOOKS_ENV_MAP') ||
      '{"Other":"DISCORD_WEBHOOKS"}'
    );
    this.WEBHOOKS_CN = JSON.parse(
      this.configService.get<string>('WEBHOOKS_CN_MAP') ||
      '{"Other":"Other"}'
    );
    const channelsStr = this.configService.get<string>('RSI_CHANNELS') || '';
    this.rsiChannels = channelsStr.split(',').map(c => c.trim());
  }

  async sendSlackNotification(message: string) {
    const BASE_URL = `${this.configService.get<any>('SLACK_WEBHOOKS')}`;
    const nexMsg = `*****************************************
    ${message.replace(/\*\*/g, '*')}`;
    const payload = {
      type: 'mrkdwn',
      text: nexMsg,
    };

    try {
      await axios.post(BASE_URL, payload);
      return { msg: 'post to Slack success' };
    } catch (error) {
      return { msg: 'post to Slack fails:', error };
    }
  }
  sentMessages = []
  async sendDiscordNotification(
    message: string,
    botname: string = 'Bot Alert',
    lastData: string,
    file?:  import('multer').File,
    extra?: any
  ) {
    const current = new Date().toISOString().replace(/T.*$/, '');
    const ticker = botname.split(' ')[1].toUpperCase();
    const webhookCl = botname.split(' ')[0].toUpperCase();
    const WEBHOOKS = this.WEBHOOKS_ENV[webhookCl] || this.WEBHOOKS_ENV.Other;
    this.webhookClient = new WebhookClient({url: this.configService.get<any>(WEBHOOKS)});
    // avatarURL: 'https://i.imgur.com/AfFp7pu.png',
    const botAvatar = {
      QQQ: 'https://image-post-625h.vercel.app/upload/eleceed/discord/QQQ.png',
      SPY: 'https://image-post-625h.vercel.app/upload/eleceed/discord/s&p.png',
      Other: `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${ticker}.png`,
    };
    // Dynamically select avatarURL based on the ticker, default to 'Other' if ticker not found
    const selectedAvatar = botAvatar[ticker] || botAvatar.Other;
    // Create the embed object
    let embed 
    let options:any
    const botdt = botname.split(' ').slice(1).join(' ');
    const color = botdt.includes('DOWN')? 0xff0000 : 0x00ff00 
    const origin = `**[localhost:4200](http://localhost:4200/price-log/${ticker})** | **[localhost:3001](http://localhost:3001/?stockTicker=${ticker})** | **[stock-chart-abc.web.app](https://stock-chart-abc.web.app/?stockTicker=${ticker})** | **[stockmarkets000.web.app](https://stockmarkets000.web.app//price-log/${ticker})** | **[TradingView](https://www.tradingview.com/chart/?symbol=${ticker})**`
    let gptres
    if(extra){
      const parts = extra.split('/');
      const id =  parts[parts.length - 1];
      gptres = `**[ASK GPT](${extra})** | **[GPT RES](https://todocalender.web.app/home/stock-track/${id}?sym=${ticker}&date=${current})**`
    }
    const setmess = extra ? `${origin} | ${gptres}`: origin
    if(botdt.includes('RSIENDBOT')){
      options = {
        username: botdt,
        content: message,
      };
    } else if(lastData === '{}'){
      embed = new EmbedBuilder()
      .setColor(color)
      .addFields({ name: botdt, value: setmess, inline: false });
      options = {
        username: botdt,
        avatarURL: selectedAvatar,
        embeds: [embed],
      };
    } else{
      const lastDataJson = await this.StopNTarget(JSON.parse(lastData));
      const selectedFields = ['date', 'close', 'stop', 'target', 'MA200', 'RSI', 'price','priceAvg200','dayHigh','yearHigh','eps', 'rsi','ema200'];
      
      embed = new EmbedBuilder()
      .setTitle('LATEST DATA')
      .setColor(color)
      .addFields({ name: botdt, value: setmess, inline: false })
      .addFields(...this.createEmbedFields(lastDataJson, selectedFields))
      // .addFields({ name: 'URL', value: `http://localhost:4200/price-prediction/${ticker}`, inline: true });
      options = {
        username: botdt,
        avatarURL: selectedAvatar,
        content: message,
        embeds: [embed],
      };
    }


    // ✅ If there's a file (image), attach it
    if (file) {
      const filename = 'capture.png';
      const attachment = new AttachmentBuilder(file.buffer, { name: filename });
      embed.setImage(`attachment://${filename}`);
      options.files = [attachment];
    }

    const sentMessage = await this.webhookClient.send(options);
    const WEBHOOKS_CNA = this.WEBHOOKS_CN[webhookCl] || this.WEBHOOKS_CN.Other;
    await this.putToFBDynamic(
      `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}/${sentMessage.id}.json`,
      `https://discord.com/channels/1306113720979689523/${sentMessage?.channel_id}/${sentMessage?.id}`
    );
    if (this.rsiChannels.some(channel => WEBHOOKS_CNA.includes(channel)) && !botdt.includes('RSIENDBOT')) {
      // store symbol of date
      await this.RsiToDatabase('RSI/' + WEBHOOKS_CNA, current+`/${ticker}`, `${ticker}`)
      // store data of the date of sym that sent to discord
      await this.RsiToDatabase('RSI-DATE-DATA',ticker+`/${current}`,{msglik:`https://discord.com/channels/1306113720979689523/${sentMessage?.channel_id}/${sentMessage?.id}`,...options})
    }
    return { msg: 'post to discord success' ,...sentMessage};
  }
  async RsiToDatabase(target: any, current:any, data:any) {
    const firebaseUrl = `alerts/${target}/${current}.json`
    await this.putToFBDynamic(firebaseUrl,data,'put');
  }

  async StopNTarget(lastdata: any) {
    const currClose = lastdata?.close; // or whatever key holds the current price
    if (currClose == null) return lastdata; // safeguard against missing price
  
    const RISK_PERCENT = 0.01;
    const REWARD_RATIO = 2;
  
    const stop = +(currClose * (1 - RISK_PERCENT)).toFixed(2);
    const target = +(currClose + (currClose - stop) * REWARD_RATIO).toFixed(2);
  
    // Update lastdata
    return {
      ...lastdata,
      stop,
      target,
    };
  }
  async deleteMessages(webhookCl: string, current: string) {
    // const current = new Date().toISOString().replace(/T.*$/, '');
    const WEBHOOKS = this.WEBHOOKS_ENV[webhookCl] || this.WEBHOOKS_ENV.Other;
    this.webhookClient = new WebhookClient({
      url: this.configService.get<any>(WEBHOOKS),
    });
    const WEBHOOKS_CNA = this.WEBHOOKS_CN[webhookCl] || this.WEBHOOKS_CN.Other;
    const getIdsOb = await this.getFromFBDynamic(
      `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}.json`,
    );
    const Ids = Object.keys(getIdsOb)
    if (Ids.length === 0) return { msg: 'nothing to delete' };
    for (const messageId of Ids) {
      try {
        await this.webhookClient.deleteMessage(messageId);
        const WEBHOOKS_CNA = this.WEBHOOKS_CN[webhookCl] || this.WEBHOOKS_CN.Other;
        await this.deleteInFB(`discord_slack_id/discord/${WEBHOOKS_CNA}/${current}/${messageId}.json`,);
      } catch (error) {
        if (error.code === 'MESSAGE_NOT_FOUND') {
          console.log(`Message ${messageId} does not exist.`);
        } else {
          console.log(`Error deleting message ${messageId}`);
        }
      }
    }
    return { msg: 'delete complete' };
  }

  async shortenUrl(url:string) {
    try {
      const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      return res.data;
    } catch (error) {
      console.error('❌ Failed to shorten URL:', error.message);
      return url; // fallback to original if API fails
    }
  }

  async getFromFBDynamic(endpoint: string) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
    let BASE_URL = `${firebaseRoot}/${endpoint}`;
    const response = await axios.get(BASE_URL);
    return response.data ? response.data : [];
  }

  async deleteInFB(endpoint: string) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
    let BASE_URL = `${firebaseRoot}/${endpoint}`;
    try {
      const response = await axios.delete(BASE_URL);
      console.log("Data deleted successfully");
    } catch (error) {
      console.log("error", error);
    }
  }
  
  async putToFBDynamic(endpoint: string, data: any, method:string= 'put') {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
    let BASE_URL = `${firebaseRoot}/${endpoint}`;
    let config = {
      method: method,
      maxBodyLength: Infinity,
      url: BASE_URL,
      headers: {
        'Content-Type': 'text/plain',
      },
      data: JSON.stringify(data),
    };
    return await axios
      .request(config)
      .then(async (response) => {
        return await JSON.stringify(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  createEmbedFields(data: Record<string, any>, fields: string[]) {
    return fields
      .map((field) => {
        const value = data[field];
        if (value === undefined || value === null) return;
        let formattedValue: string;
        if (typeof value === 'number') {
          // Format numbers with 2 decimals
          formattedValue = value.toFixed(2);
        } else if (field.toLowerCase() === 'date') {
          // Format ISO date strings to short readable form
          const date = new Date(value);
          formattedValue = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }); // e.g., "October 20, 2025"
        } else {
          formattedValue = value.toString();
        }
        return {
          name: field.toUpperCase(),
          value: formattedValue,
          inline: true,
        };
      })
      .filter((item): item is { name: string; value: string; inline: boolean } => item !== undefined);
  }
  

  async bulkDelete() {

    const getIds = await this.getFromFBDynamic(
      `discord_slack_id/discord.json`,
    );
    await this.webhookClient.deleteMessage('1427861642263396400');

    
    // console.log(getIdsOb)
    const WEBHOOKS_CNA_ALL = Object.keys(getIds)
    const WEBHOOKS_CNA_ALL_VALUE = Object.values(getIds)
    // for (let i = 0; i < WEBHOOKS_CNA_ALL.length; i++) {
    //   try {
    //     const WEBHOOKS_CNA = WEBHOOKS_CNA_ALL[i]
    //     const current_date_all = Object.keys(WEBHOOKS_CNA_ALL_VALUE[i])
    //     console.log(WEBHOOKS_CNA)
    //     console.log(current_date_all)
    //     for (let current = 0; current < current_date_all.length; current++) {
    //       const getIdsOb = await this.getFromFBDynamic(
    //         `discord_slack_id/discord/${WEBHOOKS_CNA}/${current_date_all[current]}.json`,
    //       );
    //       const Ids = Object.keys(getIdsOb)
    //       // console.log(Ids)
    //       for (const messageId of Ids) {
    //         try {
    //           console.log(messageId)
    //           console.log(`discord_slack_id/discord/${WEBHOOKS_CNA}/${current_date_all[current]}/${messageId}.json`)
    //           // await this.webhookClient.deleteMessage(messageId);
    //           // await this.deleteInFB(`discord_slack_id/discord/${WEBHOOKS_CNA}/${current_date_all[current]}/${messageId}.json`,);
    //         } catch (error) {
    //           if (error.code === 'MESSAGE_NOT_FOUND') {
    //             console.log(`Message ${messageId} does not exist.`);
    //           } else {
    //             console.log(`Error deleting message ${messageId},${error}`);
    //           }
    //         }
    //       }
    //     }
    //   } catch (error) {
    //     if (error.code === 'MESSAGE_NOT_FOUND') {
    //       // console.log(`Message ${messageId} does not exist.`);
    //     } else {
    //       // console.log(`Error deleting message ${messageId}`);
    //     }
    //   }
    // }
    return { msg: 'delete complete' };
  }
}
