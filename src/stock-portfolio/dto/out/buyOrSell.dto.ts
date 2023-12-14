import { Type, Exclude, Expose } from 'class-transformer';
import { PortfolioDTO } from './portfolio.dto';
export { PortfolioDTO } from './portfolio.dto';

export class TransactionDTO {
  @Expose({ name: 'date' })
  date: string;

  @Expose({ name: 'symbol' })
  symbol: string;

  @Expose({ name: 'amount' })
  amount: number;

  @Expose({ name: 'matchPrice' })
  matchPrice: number;

  @Expose({ name: 'netvalue' })
  netvalue: number;

  @Expose({ name: 'marketCap' })
  marketCap: number;

  @Expose({ name: 'sPortfolioId' })
  @Type(() => PortfolioDTO)
  portfolio: PortfolioDTO[];
}

export class StockHoldingDTO {
  @Exclude()
  id: string;

  @Expose({ name: 'symbol' })
  symbol: string;

  @Expose({ name: 'amount' })
  amount: number;

  @Expose({ name: 'matchPrice' })
  matchPrice: number;

  @Exclude()
  marketCap: number;
}

export class BuyOrSellDto {
  @Expose({ name: 'statusCode' })
  statusCode: number;

  @Expose({ name: 'transaction' })
  @Type(() => TransactionDTO)
  transaction: TransactionDTO[];

  @Expose({ name: 'newHolding' })
  @Type(() => StockHoldingDTO)
  stockHolding: StockHoldingDTO[];
}
