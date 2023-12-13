import { IsArray, IsOptional, IsUUID } from 'class-validator';
import {
  InDepositWithDrawDto,
  HoldingAmountsDto,
  InBuySellDto,
  UserDto,
} from './index';

export class CreateStockPortfolioDto {
  @IsUUID()
  id: string;

  @IsOptional()
  deposits?: InDepositWithDrawDto[];

  @IsArray()
  @IsOptional()
  withdraws?: InDepositWithDrawDto[];

  @IsOptional()
  balance?: number;

  @IsOptional()
  netDeposit?: number;

  @IsArray()
  @IsOptional()
  buys?: InBuySellDto[];

  @IsArray()
  @IsOptional()
  sells?: InBuySellDto[];

  @IsArray()
  @IsOptional()
  holding_amounts?: HoldingAmountsDto[];

  userId: UserDto;
}
