import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WebhookClient } from 'discord.js';
@Injectable()
export class WebhooksService {
  private webhookClient: WebhookClient;
  private sentMessages: string[] = [];
  private sentMessages2Slack: string[] = []; 

  constructor(private readonly configService: ConfigService) {
    this.webhookClient = new WebhookClient({
      id: this.configService.get<any>('DISCORD_ID'),
      token: this.configService.get<any>('DISCORD_TOKEN'),
    });
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

  async sendDiscordNotification(message: string) {
    const current = new Date().toISOString().replace(/T.*$/, '');
    const sentMessage = await this.webhookClient.send({
      content: message,
      username: 'Bot Alert',
      avatarURL: 'https://i.imgur.com/AfFp7pu.png',
    });
    this.sentMessages.push(sentMessage.id);
    await this.putToFBDynamic(
      `discord_slack_id/discord/${current}.json`,
      this.sentMessages,
    );
    return { msg: 'post to discord success' };
  }

  async deleteMessages(current: string) {
    // const current = new Date().toISOString().replace(/T.*$/, '');
    const getIds = await this.getFromFBDynamic(
      `discord_slack_id/discord/${current}.json`,
    );
    if (getIds.length === 0) return { msg: 'nothing to delete' };
    for (const messageId of getIds) {
      try {
        await this.webhookClient.deleteMessage(messageId);
      } catch (error) {
        return { msg: 'delete error' };
      }
    }
    this.sentMessages = []; // Clear the message ID list after deletion
    await this.putToFBDynamic(
      `discord_slack_id/discord/${current}.json`,
      this.sentMessages,
    );
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

