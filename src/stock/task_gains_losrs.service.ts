// src/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import * as DataSymbols from './dto/chartData';
import pLimit from 'p-limit';
import { StockService } from './stock.service';
import { instanceToPlain } from 'class-transformer';
@Injectable()
export class TasksGainsLosersService {
  allkeys = 'all'; // test
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: StockService,
  ) {}
  private readonly logger = new Logger(TasksGainsLosersService.name);
  async onModuleInit() {
    // await this.getGainsLosers();
    // await this.deleteFB();
  }
  sendORnot = [];
  @Cron('*/6 9-16 * * 1-5', { timeZone: 'America/New_York' }) // washlist
  async getGainsLosers() {
    if (this.stockHelperService.shouldRunTradingLogicUS(`5min`, this.logger)) {
      return;
    }

    this.sendORnot = [];

    const gainersClass = await this.LocalPLWR.newFMP_NewEndPoint('gainers');
    const gainers = instanceToPlain(gainersClass) as any[];

    const filtered = gainers.filter((each) =>
      DataSymbols.allabove500million.includes(each.symbol),
    );
    await Promise.all(
      filtered.map(async (each) => {
        const ticker = each.symbol;
        const indata = await this.getSymbol(ticker);

        if (indata === 'null') {
          await this.LocalPLWR.FireBaseApi(
            'put',
            `${this.stockHelperService.todayUpGains}/${ticker}.json`,
            { data: each },
          );

          const timeframe = '5min';
          const data_5min = await this.LocalPLWR.TwReveseNOAPI(
            ticker,
            timeframe,
          );

          let text_5min =
            await this.stockHelperService.CHECKBULL_BEAR_ReTurnText(
              ticker,
              timeframe,
              data_5min,
            );

          const discodedata = await this.webhooksService.sendDiscord(
            text_5min,
            `${ticker}-ON-${timeframe}-macdCrossAB`,
            data_5min[data_5min.length - 1],
            DataSymbols.watchlist.includes(ticker)
              ? 'MA_BL_5_20'
              : 'MA_BL_5_200',
            data_5min,
          );

          const imageUrl =
            discodedata?.embeds?.[0]?.image?.url ??
            discodedata?.attachments?.first()?.url;

          if (imageUrl) {
            text_5min += `<${imageUrl}|Chart>\n`;
          }

          const webhook = DataSymbols.watchlist.includes(ticker)
            ? this.stockHelperService.Z_US_SL_['4h_3C_AB']
            : this.stockHelperService.Z_US_SL_['4h_3C_BL'];

          await this.webhooksService.sendSlackNotificationVN(
            '5min',
            [ticker],
            data_5min[data_5min.length - 1],
            webhook,
            `\n${text_5min}\n`,
          );

          this.sendORnot.push(webhook);
        }
      }),
    );

    console.log(this.sendORnot);

    const webhooks = [...new Set(this.sendORnot)];

    await this.stockHelperService.sendBatchNotification(
      'START',
      'checking',
      webhooks,
      this.webhooksService,
      100,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteFB() {
    await this.LocalPLWR.FireBaseApi(
      'delete',
      `${this.stockHelperService.todayUpGains}.json`,
      {},
    );
  }
  async getSymbol(symbol: string) {
    return await this.LocalPLWR.FireBaseApi(
      'get',
      `${this.stockHelperService.todayUpGains}/${symbol}.json`,
      {},
    );
  }
}
