import { double } from 'aws-sdk/clients/lightsail';
import { Exclude, Expose, Transform } from 'class-transformer';

export class ChartOutFMPDto {
  @Expose({ name: 'date' })
  @Transform(({ value }) => value ? new Date(value) : null)
  date: Date;

  open: double
  close: double
  low: double
  high: double
  volume: double

  @Exclude()
  adjClose: any

  @Exclude()
  unadjustedVolume: any

  @Exclude()
  change: any

  @Exclude()
  changePercent: any

  @Exclude()
  vwap: any

  @Exclude()
  label: any

  @Exclude()
  changeOverTime: any
}
