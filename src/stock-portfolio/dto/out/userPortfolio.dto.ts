import { Type, Expose } from 'class-transformer';
import { HoldingAmountsDto } from '../holding-amount.dto';

export class UserPortfolioDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'balance' })
  balance: number;

  @Expose({ name: 'netDeposit' })
  netDeposit: number;

  @Expose({ name: 'holding_amounts' })
  @Type(() => HoldingAmountsDto)
  holding_amounts: HoldingAmountsDto[];
}
