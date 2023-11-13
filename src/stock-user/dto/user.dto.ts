import { IsUUID, IsString } from 'class-validator';

export class UserDto {
  @IsUUID()
  id: string;

  @IsString()
  password: string;

  @IsString()
  email: string;

  @IsString()
  displayName: string;
}
