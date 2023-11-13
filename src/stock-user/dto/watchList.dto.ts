import {
  IsUUID,
  IsDate,
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
  IsDecimal,
} from 'class-validator';
import { Decimal128 } from 'typeorm';

export class WatchListDto {
  @IsUUID()
  id: string;

  @IsString()
  dateAdded: string;

  @IsNumber()
  pctChangeAtAdded: number;

  @IsNumber()
  priceAtAdded: number;

  @IsBoolean()
  @IsOptional()
  spotline?: boolean;

  @IsString()
  symbol: string;

  @IsUUID()
  stockUserId: string;
}
