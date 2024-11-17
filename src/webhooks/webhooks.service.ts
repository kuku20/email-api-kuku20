import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WebhookClient } from 'discord.js';
@Injectable()
export class WebhooksService {
  private webhookClient: WebhookClient;
  private WEBHOOKS_ENV = {
    TSLA: 'DISCORD_WEBHOOKS_TSLA',
    Other: `DISCORD_WEBHOOKS`,
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
  ) {
    const current = new Date().toISOString().replace(/T.*$/, '');
    const ticker = botname.split(' ')[0].toUpperCase();
    const WEBHOOKS = this.WEBHOOKS_ENV[ticker] || this.WEBHOOKS_ENV.Other;
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
    const lastDataJson = JSON.parse(lastData);
    const selectedFields = ['date', 'close', 'MA200', 'RSI'];
    const embed = {
      title: 'LATEST DATA',
      color: 0x00ff00, // Green color for the embed
      fields: this.createEmbedFields(lastDataJson, selectedFields),
      // timestamp: new Date().toISOString(), // Convert Date to ISO string
    };
    const sentMessage = await this.webhookClient.send({
      username: botname,
      avatarURL: selectedAvatar,
      embeds: [embed], 
      content: message, 
    });
    await this.putToFBDynamic(
      `discord_slack_id/discord/${ticker}/${current}/${sentMessage.id}.json`,
      sentMessage?.id,
    );
    return { msg: 'post to discord success' };
  }

  async deleteMessages(ticker: string, current: string) {
    // const current = new Date().toISOString().replace(/T.*$/, '');
    const WEBHOOKS = this.WEBHOOKS_ENV[ticker] || this.WEBHOOKS_ENV.Other;
    this.webhookClient = new WebhookClient({
      url: this.configService.get<any>(WEBHOOKS),
    });
    const getIdsOb = await this.getFromFBDynamic(
      `discord_slack_id/discord/${ticker}/${current}.json`,
    );
    const Ids = Object.keys(getIdsOb)

    if (Ids.length === 0) return { msg: 'nothing to delete' };
    for (const messageId of Ids) {
      try {
        await this.webhookClient.deleteMessage(messageId);
        await this.deleteInFB(`discord_slack_id/discord/${ticker}/${current}/${messageId}.json`,);
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
