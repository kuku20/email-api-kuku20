import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { StockHelperService } from './stockHelper.service';
import { LocalPLWR } from './runlocal.service';
@Injectable()
export class PowerService {
  constructor(
    private readonly stockHelperService: StockHelperService,
    private readonly LocalPLWR: LocalPLWR,
  ) {}
  private sleepTimer?: NodeJS.Timeout;
  async onModuleInit() {
    // await this.LocalPLWR.FireBaseApi(
    //   'put',
    //   `stock-related/turnOffNow.json`,
    //   { data: true },
    // );
    const turnOffNow = await this.LocalPLWR.FireBaseApi(
      'get',
      `stock-related/turnOffNow.json`,
      '',
    );
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
