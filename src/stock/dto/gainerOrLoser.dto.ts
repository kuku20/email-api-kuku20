import { Expose } from 'class-transformer';

export class GainersOrLosersDto {
  @Expose({ name: 'changesPercentage' })
  pctChange: number;
  symbol: string
  name: string
  change: number
  price: number
}
