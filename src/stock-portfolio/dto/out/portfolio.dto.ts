import { Exclude, Expose } from 'class-transformer';

export class PortfolioDTO {
  @Exclude()
  id: string;

  @Expose({ name: 'balance' })
  balance: number;

  @Expose({ name: 'netDeposit' })
  netDeposit: number;
}
