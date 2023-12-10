import { IsArray, IsOptional, IsUUID } from 'class-validator';
import {
  BuyDto,
  DepositDto,
  HoldingAmountsDto,
  SellDto,
  WithdrawDto,
  UserDto,
} from './index';

export class CreateStockPortfolioDto {
  @IsUUID()
  id: string;

  @IsOptional()
  deposits?: DepositDto[];

  @IsArray()
  @IsOptional()
  withdraws?: WithdrawDto[];

  @IsOptional()
  balance?: number;

  @IsArray()
  @IsOptional()
  buys?: BuyDto[];

  @IsArray()
  @IsOptional()
  sells?: SellDto[];

  @IsArray()
  @IsOptional()
  holding_amounts?: HoldingAmountsDto[];

  userId: UserDto;
}
