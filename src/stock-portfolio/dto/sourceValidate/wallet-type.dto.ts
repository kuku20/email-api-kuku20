import { IsEnum,IsOptional } from 'class-validator';

export enum WalletProperty {
  BUYS = 'buys',
  SELLS = 'sells',
  DEPOSITS = 'deposits',
  WITHDRAWS = 'withdraws',
}
export class WalletTypeDto {
  @IsOptional()
  @IsEnum(WalletProperty)
  type?: WalletProperty;
}
