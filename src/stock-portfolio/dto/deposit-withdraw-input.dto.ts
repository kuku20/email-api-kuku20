import { IsUUID, IsNumber, IsString, IsPositive } from 'class-validator';
export class InDepositWithDrawDto {
  @IsUUID()
  id: string;

  @IsString()
  requestType:string;

  @IsString()
  date: string;

  @IsString()
  method?: string;

  @IsString()
  status?: string;

  @IsPositive()
  @IsNumber()
  amount: number;

  @IsUUID()
  sPortfolioId: string;
}
