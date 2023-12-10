import { IsUUID, IsNumber, IsString } from 'class-validator';
export class SellDto {
  @IsUUID()
  id: string;

  @IsString()
  dateSell?: string;

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
