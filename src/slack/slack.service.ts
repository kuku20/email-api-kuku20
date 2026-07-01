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
    // await this.createDailyChannels('BULL_BEAR_SL_',this.stockHelperService.BULL_BEAR_SL_,);
    // await this.createDailyChannels('AI_SL',this.stockHelperService.AI_SL,);
    // await this.createDailyChannels('INTRA_30M_SL_',this.stockHelperService.INTRA_30M_SL_,);
    // await this.createDailyChannels('BTN_SL',this.stockHelperService.BTN_SL,);
    // await this.createDailyChannels('US_4H_',this.stockHelperService.US_4H_,);
    // await this.createDailyChannels('US_DAILY_',this.stockHelperService.US_DAILY_,);
    // await this.createDailyChannels('VN_SL_',this.stockHelperService.VN_SL_,);
    // await this.createDailyChannels('Z_US_SL_',this.stockHelperService.Z_US_SL_,);

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
      // console.log(error)
      if (error?.data?.error === 'name_taken') {
        try {
          const channels =
          await this.client.conversations.list({
            limit: 1000,
          });
          return channels.channels?.find(
            (c) => c.name === channelName,
          );
        } catch (error) {
          console.log(error?.data?.needed)
        }
      }
      console.log(1,error.data.needed);

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
  async createDailyChannels(
    prefix: string,
    channels: Record<string, string> = {},
  ) {
    const result: Record<string, string> = {};
  
    for (const key of Object.keys(channels)) {
      const channel = await this.getOrCreateChannel(`${prefix}${key}`);
  
      if (channel) {
        await this.addUserToChannel(channel.id!, 'U0BE430MMUN');
        result[key] = channel.id!;
        await this.client.conversations.join({
          channel: channel.id,
        });
    
        console.log('Bot joined channel');
      }
  
      this.logger.log(`${prefix}${key} => ${channel?.id}`);
    }
  
    this.logger.log(JSON.stringify(result, null, 2));
  
    return result;
  }
}