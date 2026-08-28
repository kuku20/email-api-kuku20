// task.providers.ts

import { Provider } from '@nestjs/common';
import { TaskCryptoService } from './stock/task_crypto.service';
import { TasksForexService } from './stock/task_forex.service';
import { TaskQQQ_SPYService } from './stock/task_QQQ_SPY.service';
import { Tasks_US_WEEKLY } from './stock/task_us_weekly.service';
import { TasksUS_ALL_MK_MASS_MACD_OSC } from './stock/task_usmkall_mass_macd_osc.service';
import { TasksService } from './stock/tasks.service';
import { ConfigService } from '@nestjs/config';
import { TasksVNMKService } from './stock/task_vn600.service';


export function getTaskProviders(
    config: ConfigService,
): Provider[] {
  const providers: Provider[] = [
    // TasksVNMKService
  ];
  if (config.get<any>( 'TURN_ON1_OFF0') === "1") {
    providers.push(TaskCryptoService);
    providers.push(TasksForexService);
    providers.push(TaskQQQ_SPYService);
    providers.push(TasksUS_ALL_MK_MASS_MACD_OSC);
    providers.push(Tasks_US_WEEKLY);
    providers.push(TasksService);
  }

  return providers;
}