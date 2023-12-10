import { IsUUID, IsNumber, IsString } from 'class-validator';

export class BuyDto {
  @IsUUID()
  id: string;

  @IsString()
  dateBuy?: string;

  @IsString()
  symbol?: string;

  @IsNumber()
  amount?: number;

  @IsNumber()
  matchPrice?: number;

  @IsNumber()
  marketCap?: number;

  @IsUUID()
  sPortfolioId?: string;
}
