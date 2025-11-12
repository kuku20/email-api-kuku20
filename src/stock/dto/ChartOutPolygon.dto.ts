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

  @Expose({ name: 't' })
  @Transform(({ value }) => {
    if (!value) return null;
    const date = new Date(value);
    return date.toLocaleString('en-CA', { hour12: false }).replace(',', '');
  })
  date: string;

  @Exclude()
  n: number
}


export class DatePolygonDto extends ChartOutPolygonDto{
  @Expose({ name: 'p_o_c' })
  @Transform(({ value }) => Math.round(value * 100) / 100)
  pctChange: number;
}