import { IsUUID, IsNumber, IsString, IsPositive } from 'class-validator';

export class InBuySellDto {
  @IsUUID()
  id: string;

  @IsString()
  requestType:string;
  
  @IsString()
  date: string;

  @IsString()
  symbol: string;

  @IsPositive()
  @IsNumber()
  amount: number;

  @IsPositive()
  @IsNumber()
  matchPrice: number;

  @IsPositive()
  @IsNumber()
  netvalue: number;

  @IsNumber()
  marketCap: number;

  @IsUUID()
  sPortfolioId?: string;
}
