// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';

@Injectable()
export class SendEverydayService {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private readonly logger = new Logger(SendEverydayService.name);

  // // @Cron(CronExpression.EVERY_10_SECONDS)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // close yesterday and open today
  async SendEverydayService() {
    const today = this.stockHelperService.getDateNDaysAgo(0);
    const yesterday = this.stockHelperService.getDateNDaysAgo(1);
    const twoDayAgo = this.stockHelperService.getDateNDaysAgo(2);
    const equal = `===========================================`;
    const Channels = [
      'US_ALL',
      'ERORR_CALL',
      'CRON_CHECK',
      '15MIN_BUY_FX',
      '15MIN_SELL_FX',
      '30MIN_BUY_FX',
      '30MIN_SELL_FX',
      '1HOUR_BUY_FX',
      '1HOUR_SELL_FX',
      '4HOUR_BUY_FX',
      '4HOUR_SELL_FX',
      'CRYPTO_EARLY_15MIN',
      'CRYPTO_ALL',
      'US_EARLY_15MIN',
      'US_EARLY_5MIN',
      'US_30M_HT',
      'USSTOCK_WATCH',
      'US_30M_BUY',
      'US_15M_HT',
      'BUYSELL',
    ]; // example list

    for (const channel of Channels) {
      // CLOSE YESTERDAY
      await this.webhooksService.sendDiscordNotification(
        `${equal}==END-${yesterday}${equal}`,
        `${channel} RSIENDBOT`,
        JSON.stringify('lastdata'),
      );

      // START TODAY
      await this.webhooksService.sendDiscordNotification(
        `${equal}START-${today}${equal}`,
        `${channel} RSIENDBOT`,
        JSON.stringify('lastdata'),
      );

      // Log completion
      this.logger.error(`✅ Finished sending for`, channel);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // close yesterday and open today
  async delete(dayago = 1) {
    const yesterday = this.stockHelperService.getDateNDaysAgo(dayago);
    const Channels = [
      'US_ALL',
      'ERORR_CALL',
      'CRON_CHECK',
      '15MIN_BUY_FX',
      '15MIN_SELL_FX',
      '30MIN_BUY_FX',
      '30MIN_SELL_FX',
      '1HOUR_BUY_FX',
      '1HOUR_SELL_FX',
      '4HOUR_BUY_FX',
      '4HOUR_SELL_FX',
      'CRYPTO_EARLY_15MIN',
      'CRYPTO_ALL',
      'US_EARLY_15MIN',
      'US_EARLY_5MIN',
      'US_30M_HT',
      'USSTOCK_WATCH',
      'US_30M_BUY',
      'US_15M_HT',
      'BUYSELL',
      '200BL_OV_NEG_01',
      '200BL_OV_NEG_05',
      'EARLY_AB200',
      '200AB_LESS_01',
      '200AB_LESS_05',
      '200AB_LESS_1',
    ]; // example list

    await new Promise((resolve) => setTimeout(resolve, 0 * 60 * 1000));
    for (const channel of Channels) {
      // Log completion
      this.logger.error(`✅ Finished sending for`, channel, yesterday);

      // DELETE two days ago messages
      await this.webhooksService.deleteMessages(channel, yesterday);
      this.logger.error(`🗑️ Deleted old messages for`, channel, yesterday);
    }
  }

  async onModuleInit() {
    // This runs ONCE when the app starts
    // await this.SendEverydayService();
    await this.delete(2);
    // await this.delete(3);
    // await this.delete(4);
    // await this.delete(5);
    // await this.delete(6);
    // await this.delete(7);
    // await this.delete(8);
    // await this.delete(9);
    // console.log(  stock_500_symbols.length)
  }
}
