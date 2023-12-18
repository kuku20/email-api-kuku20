import { IsUUID, IsNumber, IsString, IsPositive, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsNumber()
  atPctChange?: number;

  @IsPositive()
  @IsNumber()
  netvalue: number;

  @IsOptional()
  @IsNumber()
  netProfit?: number;
  
  @IsOptional()
  @IsNumber()
  avaragePriceB?: number;

  @IsNumber()
  marketCap: number;

  @IsUUID()
  sPortfolioId?: string;
}
