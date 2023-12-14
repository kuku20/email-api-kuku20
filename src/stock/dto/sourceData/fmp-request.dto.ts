import { IsEnum } from 'class-validator';

export enum FMPRType {
  RTP = 'realtimeprice',
  RTPA = 'realtimepriceall',
  MCP = 'multiple-company-prices',
  GAINORlOSE = 'gainers-or-losers',
  SEARCH = 'search',
}
export class FmpDto {
  @IsEnum(FMPRType)
  type: FMPRType;
}
