import { IsUUID, IsString,IsNumber } from 'class-validator';

export class HoldingAmountsDto {
  @IsUUID()
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
