import { IsUUID, IsString } from 'class-validator';

export class HoldingAmountsDto {
  @IsUUID()
  id: string;

  @IsString()
  password: string;

  @IsString()
  email: string;

  @IsString()
  displayName: string;
}
