import { IsUUID, IsNumber, IsString, IsPositive } from 'class-validator';

export class BuyDto {
  @IsUUID()
  id: string;

  @IsString()
  date?: string;

  @IsString()
  symbol?: string;

  @IsPositive()
  @IsNumber()
  amount?: number;

  @IsPositive()
  @IsNumber()
  matchPrice?: number;

  @IsPositive()
  @IsNumber()
  netvalue?: number;

  @IsNumber()
  marketCap?: number;

  @IsUUID()
  sPortfolioId?: string;
}
