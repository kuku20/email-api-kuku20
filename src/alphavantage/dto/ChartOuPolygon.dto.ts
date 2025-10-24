import { Exclude, Expose, Transform } from 'class-transformer';

export class ChartOutPolygonDto {

  @Expose({name:'value'})
  @Transform(({ value }) => value ? parseFloat(parseFloat(value).toFixed(2)) : null)
  value: number

  @Expose({ name: 'timestamp' })
  @Transform(({ value }) => value ? new Date(value) : null)
  date: Date;
}
