import { Exclude, Expose } from 'class-transformer';

export class DividendOutDto {
  @Expose({ name: 'ticker' })
  symbol: string;
  // @Exclude()
  cash_amount: number
  currency: string
  declaration_date: string
  dividend_type: string
  ex_dividend_date: string
  frequency: number
  pay_date: string
  record_date: string
}
