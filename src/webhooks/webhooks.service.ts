import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WebhookClient } from 'discord.js';
@Injectable()
export class WebhooksService {
  private webhookClient: WebhookClient;
  private sentMessages2Slack: string[] = []; 

  constructor(private readonly configService: ConfigService) {
    this.webhookClient = new WebhookClient({url: this.configService.get<any>('DISCORD_WEBHOOKS')});
  }

  async sendSlackNotification(message: string) {
    const BASE_URL = `${this.configService.get<any>('SLACK_WEBHOOKS')}`;
    const payload = {
      text: message, // Slack expects "text" for the message content
    };

    try {
      const response = await axios.post(BASE_URL, payload);
      const current = new Date().toISOString().replace(/T.*$/, '');
      if (response.data && response.data.ts) {
        this.sentMessages2Slack.push(response.data.ts);
        await this.putToFBDynamic(
          `discord_slack_id/slack/${current}.json`,
          this.sentMessages2Slack,
        );
      }
      return { msg: 'post to Slack success' };
    } catch (error) {
      return { msg: 'post to Slack fails:', error };

    }
  }
  createEmbedFields(data, fields) {
    return fields.map((field) => ({
      name: field.toUpperCase(), // The key as the field name
      value: data[field].toString(), // Convert the value to a string
      inline: true, // Display fields inline for a compact layout
    }));
  }
  
  async sendDiscordNotification(message: string, botname:string='Bot Alert', lastData:string) {
    const current = new Date().toISOString().replace(/T.*$/, '');
    const ticker = botname.split(' ')[0].toUpperCase()
    const WEBHOOKS_ENV ={
      TSLA:'DISCORD_WEBHOOKS_TSLA',
      Other:`DISCORD_WEBHOOKS`
    }
    const WEBHOOKS = WEBHOOKS_ENV[ticker] || WEBHOOKS_ENV.Other;
    this.webhookClient = new WebhookClient({url: this.configService.get<any>(WEBHOOKS)});

    const sentMessages = await this.getFromFBDynamic(
      `discord_slack_id/discord/${ticker}/${current}.json`,
    );
    // avatarURL: 'https://i.imgur.com/AfFp7pu.png',
    const botAvatar ={
      QQQ:'https://image-post-625h.vercel.app/upload/eleceed/discord/QQQ.png',
      SPY:'https://image-post-625h.vercel.app/upload/eleceed/discord/s&p.png',
      Other:`https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${ticker}.png`
    }
    // Dynamically select avatarURL based on the ticker, default to 'Other' if ticker not found
    const selectedAvatar = botAvatar[ticker] || botAvatar.Other;
    // Create the embed object
    const lastDataJson = JSON.parse(lastData)
    const selectedFields = ["date", "close", "MA200", "RSI"];
    const embed = {
      title: "LATEST DATA",
      color: 0x00ff00, // Green color for the embed
      fields: this.createEmbedFields(lastDataJson, selectedFields),
      // timestamp: new Date().toISOString(), // Convert Date to ISO string
    };
    const sentMessage = await this.webhookClient.send({
      username: botname,
      avatarURL: selectedAvatar,
      embeds: [embed],  // Embed first
      content: message,  // Content second (below the embed)
    });
    sentMessages.push(sentMessage.id);
    await this.putToFBDynamic(
      `discord_slack_id/discord/${ticker}/${current}.json`,
      sentMessages,
    );
    return { msg: 'post to discord success' };
  }

  async deleteMessages(ticker:string, current: string) {
    // const current = new Date().toISOString().replace(/T.*$/, '');
    const WEBHOOKS_ENV ={
      TSLA:'DISCORD_WEBHOOKS_TSLA',
      Other:`DISCORD_WEBHOOKS`
    }
    const WEBHOOKS = WEBHOOKS_ENV[ticker] || WEBHOOKS_ENV.Other;
    this.webhookClient = new WebhookClient({url: this.configService.get<any>(WEBHOOKS)});
    const getIds = await this.getFromFBDynamic(
      `discord_slack_id/discord/${ticker}/${current}.json`,
    );
    if (getIds.length === 0) return { msg: 'nothing to delete' };
    for (const messageId of getIds) {
      try {
        await this.webhookClient.deleteMessage(messageId);
      } catch (error) {
        if (error.code === 'MESSAGE_NOT_FOUND') {
          console.log(`Message ${messageId} does not exist.`);
      } else {
          console.log(`Error deleting message ${messageId}`);
      }
      }
    }
    await this.putToFBDynamic(`discord_slack_id/discord/${ticker}/${current}.json`,[],);
    return { msg: 'delete complete' };
  }

  async getFromFBDynamic(endpoint: string) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
    let BASE_URL = `${firebaseRoot}/${endpoint}`;
    const response = await axios.get(BASE_URL);
    return response.data ? response.data : [];
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
}
