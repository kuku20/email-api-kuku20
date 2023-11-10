import { Expose } from 'class-transformer';

export class RealTimePriceFinnhubDto {
  @Expose({ name: 'c' })
  price: number;
  @Expose({ name: 'd' })
  change: number;
  @Expose({ name: 'dp' })
  pctChange: number;
  @Expose({ name: 'h' })
  dayHigh: number;
  @Expose({ name: 'l' })
  dayLow: number;
  @Expose({ name: 'o' })
  open: number;
  @Expose({ name: 'pc' })
  previousClose: number;
}
