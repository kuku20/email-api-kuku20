import { Exclude, Expose } from 'class-transformer';

export class InsiderTransactionsDto {
  @Expose()
  symbol: string;
  // @Exclude()
  @Expose()
  change: number
  @Expose()
  filingDate: string
  @Expose({ name: 'share' })
  amount: number
  @Expose({ name: 'transactionPrice' })
  txnPrice: number
  @Expose({ name: 'transactionDate' })
  txnDate: string

  @Exclude()
  id: string
  isDerivative: boolean
  name: string
  @Exclude()
  source: string
  @Exclude()
  transactionCode: string
  
}
