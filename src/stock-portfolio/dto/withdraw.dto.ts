import { IsUUID, IsNumber, IsString,IsPositive } from 'class-validator';
export class WithdrawDto {
  @IsUUID()
  id: string;

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
