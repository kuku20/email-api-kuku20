import { IsDateString, IsEnum, IsString } from 'class-validator';

export enum TIMESPAN {
  FMP_HC = 'historical-chart',
  PO_SECOND = 'second',
  PO_MINUTE = 'minute',
  PO_HOUR = 'hour',
  PO_DAY = 'day',
  PO_WEEK = 'week',
  PO_MONTH = 'month',
  PO_QUATER = 'quater',
  PO_YEAR = 'year',
}
export class TimeSpanDto {
  @IsEnum(TIMESPAN)
  timespan: TIMESPAN;
}


export enum TimeRange {
    ONE_MIN = '1min',
    FIVE_MIN = '5min',
    ONE_FIVE_MIN = '15min',
    THRY_MIN = '30min',
    ONE_HOUR = '1hour',
    FOUR_HOUR = '4hour',
    ONE = '1',
    THREE = '3',
    FOUR = '4',
    FIVE = '5',
    FIVETEEN = '15',
    THIRTY = '30',
  }
  export class TimeRangeDto {
    @IsEnum(TimeRange)
    range: TimeRange;
    
    @IsDateString({ strict: true }, { message: 'start must be in the format YYYY-MM-DD' })
    start: string;

    @IsDateString({ strict: true }, { message: 'end must be in the format YYYY-MM-DD' })
    end: string;

    @IsString({ message: 'start must be a string' })
    limit:string;

    @IsString({ message: 'start must be a string' })
    stockTicker:string;
  }

  