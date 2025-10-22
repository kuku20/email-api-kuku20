import { Exclude, Expose, Transform } from 'class-transformer';

export class ChartOutPolygonDto {

  @Expose({name:'v'})
  volume: number

  // @Expose({name:'vw'})
  @Exclude()
  vw: number

  @Expose({name:'o'})
  open: number

  @Expose({name:'c'})
  close: number

  @Expose({name:'l'})
  low: number

  @Expose({name:'h'})
  high: number

  @Expose({ name: 'timestamp' })
  @Transform(({ value }) => value ? new Date(value) : null)
  date: Date;

  @Exclude()
  n: number
}


export class DatePolygonDto extends ChartOutPolygonDto{
  @Expose({ name: 'p_o_c' })
  @Transform(({ value }) => Math.round(value * 100) / 100)
  pctChange: number;
}