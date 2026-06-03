import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import { StockHelperService } from 'src/stock/stockHelper.service';


/*
  go to https://api.slack.com/apps/ to create a new app and get the bot token, then add it to your .env file as SLACK_BOT_TOKEN.
  Only update the xoxb token in .env file, and it will auto-create channels on startup if needed. 
  update the SLID in stockHelperService with the new channel IDs after they are created.
  
*/

@Injectable()
export class SlackService implements OnModuleInit {
  private readonly logger = new Logger(SlackService.name);
  private readonly client: WebClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly stockHelperService: StockHelperService,
  ) {
    // this.stockHelperService.setSlackToken('SLACK_USER_TRADING_TOKEN');
    // this.stockHelperService.setSlackToken('SLACK_BOT_TOKEN_WEEKLY');
    const slackToken = this.configService.get<string>(this.stockHelperService.slackTokenKey);

    if (!slackToken) {
      throw new Error('SLACK_BOT_TOKEN is not configured');
    }

    this.client = new WebClient(slackToken);
  }

  async onModuleInit() {
    this.logger.log('Initializing SlackService...');

    // OPTIONAL: auto-create on startup
    // Comment this out if you don't want Slack API calls on boot
    // await this.createDailyChannels(this.stockHelperService.AI_SL);
    // await this.createDailyChannels(this.stockHelperService.INTRA_30M_SL);
    // await this.createDailyChannels(this.stockHelperService.US_4H_);
    // await this.createDailyChannels(this.stockHelperService.US_DAILY_);
    // await this.createDailyChannels(this.stockHelperService.VN_SL);
    // this.stockHelperService.setSlackToken('SLACK_BOT_TOKEN_WEEKLY');
    // await this.createDailyChannels(this.stockHelperService.US_WK_); SLACK_BOT_TOKEN_WEEKLY
    // this.stockHelperService.setSlackToken('SLACK_USER_TRADING_TOKEN')
    // await this.createDailyChannels(this.stockHelperService.US_WK_); 
  }

  private normalizeChannelName(name: string): string {
    return name
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/\s+/g, '-');
  }

  async createChannel(
    name: string,
    isPrivate = false,
  ) {
    const channelName = this.normalizeChannelName(name);

    try {
      const result =
        await this.client.conversations.create({
          name: channelName,
          is_private: isPrivate,
        });

      this.logger.log(
        `Channel created: ${result.channel?.id}`,
      );

      return result.channel;
    } catch (error: any) {
      this.logger.error(
        `Failed to create channel: ${
          error?.data?.error ?? error.message
        }`,
      );
      console.log(error.data.needed);
    }
  }

  async getOrCreateChannel(name: string) {
    const channelName = this.normalizeChannelName(name);

    try {
      const result =
        await this.client.conversations.create({
          name: channelName,
          is_private: false,
        });

      return result.channel;
    } catch (error: any) {
      if (error?.data?.error === 'name_taken') {
        const channels =
          await this.client.conversations.list({
            limit: 1000,
          });

        return channels.channels?.find(
          (c) => c.name === channelName,
        );
      }
      console.log(error.data.needed);

    }
  }
  async addUserToChannel(channelId: string, userId: string) {
    try {
      const result = await this.client.conversations.invite({
        channel: channelId,
        users: userId, // e.g. "U12345678"
      });
  
      this.logger.log(
        `User ${userId} added to channel ${channelId}`,
      );
  
      return result;
    } catch (error: any) {
      this.logger.error(
        `Failed to add user: ${
          error?.data?.error ?? error.message
        }`,
      );
    }
  }
  async createDailyChannels(channels: Record<string, string> = {}) {
    for (const key of Object.keys(channels)) {
      const channel =
        await this.getOrCreateChannel(key);

      channels[key] = channel?.id ?? '';
      this.addUserToChannel(channels[key], 'U0B0HL7TC1W'); // U0B7A38HBK3
      this.logger.log(
        `${key} => ${channels[key]}`,
      );
    }

    this.logger.log(
      `Final channel map: ${JSON.stringify(
        channels,
        null,
        2,
      )}`,
    );

    return channels;
  }
}