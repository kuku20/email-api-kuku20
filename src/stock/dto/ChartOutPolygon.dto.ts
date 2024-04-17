import { double } from 'aws-sdk/clients/lightsail';
import { Exclude, Expose, Transform } from 'class-transformer';

export class ChartOutPolygonDto {

  @Expose({name:'v'})
  volume: double

  @Expose({name:'vw'})
  volume_weighted: double

  @Expose({name:'o'})
  open: double

  @Expose({name:'c'})
  close: double

  @Expose({name:'l'})
  low: double

  @Expose({name:'h'})
  high: double

  @Expose({ name: 't' })
  @Transform(({ value }) => value ? new Date(value) : null)
  date: Date;

  @Exclude()
  n: number
}
