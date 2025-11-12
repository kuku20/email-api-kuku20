import { Exclude, Expose, Transform } from 'class-transformer';

export class alphaAdjusteddto {

  @Expose({name:'6. volume'})
  @Transform(({ value }) => parseFloat(value))
  volume: number

  @Expose({name:'7. dividend amount'})
  @Transform(({ value }) => parseFloat(value))
  dividend: number

  @Expose({name:'1. open'})
  @Transform(({ value }) => parseFloat(value))
  open: number

  @Expose({name:'5. adjusted close'})
  @Transform(({ value }) => parseFloat(value))
  close: number

  @Expose({name:'3. low'})
  @Transform(({ value }) => parseFloat(value))
  low: number

  @Expose({name:'2. high'})
  @Transform(({ value }) => parseFloat(value))
  high: number

  @Expose({ name: 'date' })
  @Transform(({ value }) => {
    if (!value) return null;
    const date = new Date(value);
    return date.toLocaleString('en-CA', { hour12: false }).replace(',', '');
  })
  date: string;
}
