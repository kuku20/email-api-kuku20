// finnhub.dto.ts

import { IsEnum } from 'class-validator';
// import { FhRequestType } from './finnhub-request.type'; // Import your enum definition
export enum FhRequestType {
  EARNING = 'earnings',
  NEWS = 'news',
  RTP = 'realtimeprice',
  ComPro = 'company-profile',
  INTRAN = 'insider-transactions',
  TICKLIST = 'ticker-list',
}
export class FinnhubDto {
  @IsEnum(FhRequestType)
  type: FhRequestType;
}
