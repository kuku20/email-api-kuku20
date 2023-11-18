import { Exclude, Expose } from 'class-transformer';

export class EarningCalFinnhubOut {
  @Expose()
  date: string
  @Expose()
  epsActual: number
  @Expose()
  epsEstimate: number
  @Expose()
  hour: string
  @Expose()
  quarter: number
  @Expose()
  revenueActual: number
  @Expose()
  revenueEstimate: number
  @Expose()
  symbol: string
  @Expose()
  year: number
}
