import { IsUUID, IsString, IsNumber } from 'class-validator';
import { Exclude } from 'class-transformer';
export class HoldingAmountsDto {
  @IsUUID()
  // @Exclude()
  id: string;

  @IsString()
  symbol?: string;

  @IsNumber()
  amount?: number;

  @IsNumber()
  matchPrice?: number;

  @IsNumber()
  marketCap?: number;

  @IsUUID()
  sPortfolioId: string;
}
