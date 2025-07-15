import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AttachmentBuilder,EmbedBuilder, WebhookClient } from 'discord.js';
@Injectable()
export class WebhooksService {
  private webhookClient: WebhookClient;
  private WEBHOOKS_ENV = {
    TSLA: 'DISCORD_WEBHOOKS_TSLA',
    SMCI: 'DISCORD_WEBHOOKS_SMCI',
    BUY: 'DISCORD_WEBHOOKS_BUYSELL',
    SELL: 'DISCORD_WEBHOOKS_BUYSELL',
    BUYSELL: 'DISCORD_WEBHOOKS_BUYSELL',
    Other: `DISCORD_WEBHOOKS`,
  };

  private WEBHOOKS_CN = {
    TSLA: 'TSLA',
    SMCI: 'SMCI',
    BUY: 'BUYSELL',
    SELL: 'BUYSELL',
    BUYSELL: 'BUYSELL',
    Other: `Other`,
  };
  constructor(private readonly configService: ConfigService) {}

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
  ) {
    const current = new Date().toISOString().replace(/T.*$/, '');
    const action = botname.split(' ')[0].toUpperCase();
    const ticker = botname.split(' ')[1].toUpperCase();
    const WEBHOOKS = this.WEBHOOKS_ENV[action] || this.WEBHOOKS_ENV.Other;
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
    const lastDataJson = await this.StopNTarget(JSON.parse(lastData));
    const selectedFields = ['date', 'close', 'stop', 'target', 'MA200', 'RSI'];
    const embed = new EmbedBuilder()
    .setTitle('LATEST DATA')
    .setColor(0x00ff00)
    .addFields(...this.createEmbedFields(lastDataJson, selectedFields))
    .addFields({ name: 'URL', value: `http://localhost:4200/price-prediction/${ticker}`, inline: true });

    const options: any = {
      username: botname,
      avatarURL: selectedAvatar,
      content: message,
      embeds: [embed],
    };
  
    // ✅ If there's a file (image), attach it
    if (file) {
      const filename = 'capture.png';
      const attachment = new AttachmentBuilder(file.buffer, { name: filename });
      embed.setImage(`attachment://${filename}`);
      options.files = [attachment];
    }

    const sentMessage = await this.webhookClient.send(options);
    const WEBHOOKS_CNA = this.WEBHOOKS_CN[action] || this.WEBHOOKS_CN.Other;
    await this.putToFBDynamic(
      `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}/${sentMessage.id}.json`,
      sentMessage?.id,
    );
    return { msg: 'post to discord success' };
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
  async deleteMessages(ticker: string, current: string) {
    // const current = new Date().toISOString().replace(/T.*$/, '');
    const WEBHOOKS = this.WEBHOOKS_ENV[ticker] || this.WEBHOOKS_ENV.Other;
    this.webhookClient = new WebhookClient({
      url: this.configService.get<any>(WEBHOOKS),
    });
    const WEBHOOKS_CNA = this.WEBHOOKS_CN[ticker] || this.WEBHOOKS_CN.Other;
    const getIdsOb = await this.getFromFBDynamic(
      `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}.json`,
    );
    const Ids = Object.keys(getIdsOb)

    if (Ids.length === 0) return { msg: 'nothing to delete' };
    for (const messageId of Ids) {
      try {
        await this.webhookClient.deleteMessage(messageId);
        const WEBHOOKS_CNA = this.WEBHOOKS_CN[ticker] || this.WEBHOOKS_CN.Other;
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
  
  async putToFBDynamic(endpoint: string, data: any) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
    let BASE_URL = `${firebaseRoot}/${endpoint}`;
    let config = {
      method: 'put',
      maxBodyLength: Infinity,
      url: BASE_URL,
      headers: {
        'Content-Type': 'text/plain',
      },
      data: data,
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
  
  createEmbedFields(data:unknown, fields) {
    return fields.map((field) => {
      if(data[field])
      return (
        {
          name: field?.toUpperCase(), 
          value: data[field]?.toString(), 
          inline: true, 
        }
      )
    }).filter((item: any)=>item!== undefined);
  }
}
