import {
  IsUUID,
  IsDate,
  IsNumber,
  IsBoolean,
  IsString,
  IsOptional,
} from 'class-validator';


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

export class UpdateWatchListDto {
  @IsString()
  dateAdded: string;

  @IsNumber()
  pctChangeAtAdded: number;

  @IsNumber()
  priceAtAdded: number;

  @IsBoolean()
  @IsOptional()
  spotline?: boolean;

}
