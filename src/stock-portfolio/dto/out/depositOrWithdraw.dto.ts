import { Type, Exclude, Expose } from 'class-transformer';
import { PortfolioDTO } from './portfolio.dto';
export { PortfolioDTO } from './portfolio.dto';

export class MoneyTransDTO {
  @Expose({ name: 'date' })
  date: string;

  @Expose({ name: 'method' })
  method: string;

  @Expose({ name: 'status' })
  status: string;

  @Expose({ name: 'amount' })
  amount: number;

  @Expose({ name: 'sPortfolioId' })
  @Type(() => PortfolioDTO)
  portfolio: PortfolioDTO[];

  @Exclude()
  id: string;
}

export class DepositOrWithdrawDto {
  @Expose({ name: 'statusCode' })
  statusCode: number;

  @Expose({ name: 'transaction' })
  @Type(() => MoneyTransDTO)
  transaction: MoneyTransDTO[];
}
