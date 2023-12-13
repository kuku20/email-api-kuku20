import { IsUUID, IsNumber, IsString } from 'class-validator';
export class SellDto {
  @IsUUID()
  id: string;

  @IsString()
  date?: string;

  @IsString()
  symbol?: string;

  @IsNumber()
  amount?: number;

  @IsNumber()
  matchPrice?: number;

  @IsNumber()
  marketCap?: number;

  @IsNumber()
  netvalue?: number;

  @IsUUID()
  sPortfolioId: string;
}
