import { Exclude, Expose, Transform } from 'class-transformer';

export class ChartOutPolygonDto {

  @Expose({name:'value'})
  @Transform(({ value }) => value ? parseFloat(parseFloat(value).toFixed(2)) : null)
  value: number

  @Expose({ name: 'timestamp' })
  @Transform(({ value }) => {
    if (!value) return null;
    const date = new Date(value);
    return date.toLocaleString('en-CA', { hour12: false }).replace(',', '');
  })
  date: string;
}
