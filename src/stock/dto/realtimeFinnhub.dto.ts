import { Expose } from 'class-transformer';

export class RealTimePriceFinnhubDto {
  @Expose({ name: 'c' })
  current_price: number;
  @Expose({ name: 'd' })
  change: number;
  @Expose({ name: 'dp' })
  percent_change: number;
  @Expose({ name: 'h' })
  high_of_the_day: number;
  @Expose({ name: 'l' })
  low_of_the_day: number;
  @Expose({ name: 'o' })
  open_price_otd: number;
  @Expose({ name: 'pc' })
  previous_close_price: number;
}
