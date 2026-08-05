import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
import { Cron } from '@nestjs/schedule';
import { WebhooksService } from 'src/webhooks/webhooks.service';
@Injectable()
export class PowerService {
  constructor(
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
        private readonly webhooksService: WebhooksService,
  ) {}
  private sleepTimer?: NodeJS.Timeout;
  async onModuleInit() {
    // await this.bullBear_15MIN()
    // await this.LocalPLWR.FireBaseApi(
    //   'put',
    //   `stock-related/turnOffNow.json`,
    //   { data: true },
    // );
  }

  @Cron('*/15 * * * *')
  async bullBear_15MIN() {
    const turnOffNow = 
    await this.LocalPLWR.FireBaseApi(
      'get',
      `stock-related/turnOffNow.json`,
      '',
    );
    console.log("turnOffNow",turnOffNow)
    
    await this.stockHelperService.sendBatchNotification('START','powerCheck'+JSON.stringify(turnOffNow),[this.stockHelperService.Z_US_SL_.OR],this.webhooksService,100,);
    if (turnOffNow.data) {
      clearTimeout(this.sleepTimer);
    
      this.sleepTimer = setTimeout(() => {
        this.sleepMac();
        this.sleepTimer = undefined;
      }, 60_000);
    } else {
      console.log('turnOffNow is false, not going to sleep.');
    }
  }

  sleepMac() {
    exec('pmset sleepnow', (error, stdout, stderr) => {
      if (error) {
        console.error('Failed to sleep:', error);
        return;
      }

      console.log('Mac is going to sleep...');
    });
  }
}