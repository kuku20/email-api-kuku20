import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { WatchListDto } from './watchList.dto';
import { UserDto } from './user.dto';

export class CreateStockUserDto {
  @IsUUID()
  id: string;

  @IsArray()
  @IsOptional()
  listTickers?: string[];

  @IsOptional()
  watchlists?: WatchListDto[];

  userId: UserDto;
}
