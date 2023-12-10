import { Exclude, Expose, Transform } from 'class-transformer';

export class WalletOutPutDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'userId' })
  @Transform(({ value }) => (value ? value.id : null))
  userId;

  @Expose({ name: 'deposits' })
  deposits: [];

  @Expose({ name: 'withdraws' })
  withdraws: [];

  @Expose({ name: 'balance' })
  balance: [];

  @Expose({ name: 'buys' })
  buys: [];

  @Expose({ name: 'sells' })
  sells: [];

  @Expose({ name: 'holding_amounts' })
  holdingAmounts?: [];
}
